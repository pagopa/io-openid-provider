import * as http from "http";
import * as path from "path";
import express from "express";
import helmet from "helmet";
import * as cookies from "cookie-parser";
import { Config } from "../../config";
import { Logger } from "../../domain/logger";
import { ConfirmConsentUseCase } from "../../domain/useCases/ConfirmConsentUseCase";
import { ClientListUseCase } from "../../domain/useCases/ClientListUseCase";
import { AuthenticateUseCase } from "../../domain/useCases/AuthenticateUseCase";
import { FindGrantUseCase } from "../../domain/useCases/FindGrantUseCases";
import { ProcessInteractionUseCase } from "../../domain/useCases/ProcessInteractionUseCase";
import { RemoveGrantUseCase } from "../../domain/useCases/RemoveGrantUseCase";
import { AbortInteractionUseCase } from "../../domain/useCases/AbortInteractionUseCase";
import { ClientService } from "../../domain/clients/ClientService";
import { GrantService } from "../../domain/grants/GrantService";
import { InteractionService } from "../../domain/interactions/InteractionService";
import { SessionService } from "../../domain/sessions/SessionService";
import * as openidConnect from "./openidConnect";
import * as clients from "./clients";
import * as grants from "./grants";

/** This trait defined all the dependencies required by the Application */
export interface AppEnv {
  readonly config: Config;
  readonly logger: Logger;
  readonly abortInteractionUseCase: AbortInteractionUseCase;
  readonly authenticateUseCase: AuthenticateUseCase;
  readonly clientListUseCase: ClientListUseCase;
  readonly confirmConsentUseCase: ConfirmConsentUseCase;
  readonly findGrantUseCase: FindGrantUseCase;
  readonly processInteractionUseCase: ProcessInteractionUseCase;
  readonly removeGrantUseCase: RemoveGrantUseCase;
  readonly clientService: ClientService;
  readonly grantService: GrantService;
  readonly interactionService: InteractionService;
  readonly sessionService: SessionService;
}

/**
 * Create and return an application ready do be started
 */
export const makeApplication = ({
  config,
  logger,
  abortInteractionUseCase,
  authenticateUseCase,
  clientListUseCase,
  confirmConsentUseCase,
  findGrantUseCase,
  processInteractionUseCase,
  removeGrantUseCase,
  clientService,
  grantService,
  interactionService,
  sessionService,
}: AppEnv): express.Application => {
  const application = express();

  // Enable helmet
  if (config.server.enableHelmet) {
    application.use(helmet());
  }

  // Add a middleware that parses JSON HTTP
  // request bodies into JavaScript objects
  application.use(express.json());
  // Add a middleware to parse urlencoded bodies
  application.use(express.urlencoded());
  // Add a middleware that parse cookies
  application.use(cookies.default());
  // Serve static files
  application.use(express.static(path.join(__dirname, "public")));

  // Template engine configuration
  application.set("views", path.join(__dirname, "views"));
  application.set("view engine", "ejs");

  /* Mount the routes */
  // mount some custom client endpoints
  application.use(clients.makeRouter(clientListUseCase));
  // mount grant endpoints
  application.use(
    grants.makeRouter(logger, findGrantUseCase, removeGrantUseCase)
  );
  // mount openid-connect endpoints
  application.use(
    openidConnect.makeRouter({
      abortInteractionUseCase,
      authenticateUseCase,
      clientListUseCase,
      clientService,
      config,
      confirmConsentUseCase,
      findGrantUseCase,
      grantService,
      interactionService,
      logger,
      processInteractionUseCase,
      removeGrantUseCase,
      sessionService,
    })
  );

  const { port, hostname } = config.server;
  application.set("port", port);
  application.set("hostname", hostname);
  return application;
};

/**
 * Start the given application
 */
export const startApplication = (
  application: express.Application,
  logger: Logger
): void => {
  const port = application.get("port");
  logger.info(`Starting application on port ${port}`);
  const server = http.createServer(application);
  server.listen(port, application.get("hostname"), () => {
    logger.info(`Server is listening on port ${port}`);
  });
};
