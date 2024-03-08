import * as http from "http";
import express from "express";
import helmet from "helmet";
import cookies from "cookie-parser";

import { Config } from "../../config.js";
import { Logger } from "../../domain/logger/index.js";
import { ClientService } from "../../domain/clients/ClientService.js";
import { GrantService } from "../../domain/grants/GrantService.js";
import { InteractionService } from "../../domain/interactions/InteractionService.js";
import { SessionService } from "../../domain/sessions/SessionService.js";
import { UseCases } from "../../useCases/index.js";
import * as openidConnect from "./openidConnect/index.js";
import * as clients from "./clients/index.js";
import * as grants from "./grants/index.js";
import * as info from "./info/index.js";

//const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

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
  application.use(cookies());
  // Serve static files
  application.use(express.static("public"));

  // Template engine configuration
  application.set("views", "views");
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
