import * as http from "http";
import * as path from "path";
import express from "express";
import helmet from "helmet";
import * as cookies from "cookie-parser";
import { Config } from "../../config";
import { Logger } from "../../domain/logger";
import { ClientService } from "../../domain/clients/ClientService";
import { GrantService } from "../../domain/grants/GrantService";
import { InteractionService } from "../../domain/interactions/InteractionService";
import { SessionService } from "../../domain/sessions/SessionService";
import { UseCases } from "../../useCases";
import * as openidConnect from "./openidConnect";
import * as clients from "./clients";
import * as grants from "./grants";
import * as info from "./info";

/**
 * This trait defined all the dependencies required by the Application.
 * Because of nodeOidcProvider, we need the services to wrap them into the
 * library's adapters. The best is depend only on use-cases
 */
export interface AppEnv {
  readonly config: Config;
  readonly useCases: UseCases;
  readonly logger: Logger;
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
  clientService,
  grantService,
  interactionService,
  sessionService,
  useCases,
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

  application.use(info.makeRouter(config));

  /* Mount the routes */
  // mount some custom client endpoints
  application.use(clients.makeRouter(useCases.clientListUseCase));
  // mount grant endpoints
  application.use(
    grants.makeRouter(
      logger,
      useCases.findGrantUseCase,
      useCases.removeGrantUseCase,
      useCases.listGrantUseCase
    )
  );

  // mount openid-connect endpoints
  application.use(
    openidConnect.makeRouter({
      clientService,
      config,
      grantService,
      interactionService,
      logger,
      sessionService,
      useCases,
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
