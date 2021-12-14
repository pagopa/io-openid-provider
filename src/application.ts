import express from "express";
import helmet from "helmet";
// TODO: Remove the @pagopa/cloudgaap-commons-ts dependency
import { Logger } from "@pagopa/cloudgaap-commons-ts/lib/logger";
import * as info from "./info/router";
import { Config } from "./config";

const makeErrorRequestHandler =
  (logger: Logger): express.ErrorRequestHandler =>
  (err, _req, resp, _next) => {
    logger.error(`Something went wrong. Error: ${err}`);
    resp
      .status(500)
      .send({ code: "GENERIC_ERROR", message: "Something went wrong" });
  };

type Application = express.Application;

const makeApplication = (config: Config, logger: Logger): Application => {
  const application = express();

  // Enable helmet
  application.use(helmet());
  // Add a middleware that parses JSON HTTP
  // request bodies into JavaScript objects
  application.use(express.json());

  const serverConfig = config.server;

  // Register routers
  // application.use(component.makeRouter(service0, service1, ...));
  application.use(info.makeRouter(config));

  // Register error handler
  application.use(makeErrorRequestHandler(logger));

  application.set("port", serverConfig.port);
  application.set("hostname", serverConfig.hostname);
  return application;
};

export { Application, makeApplication };
