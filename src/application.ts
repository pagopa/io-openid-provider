import express from "express";
import helmet from "helmet";
import * as info from "./info/router";
import * as oidcprovider from "./oidcprovider/router";
import { Config } from "./config";
import { Logger } from "./logger";

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
  application.use(oidcprovider.makeRouter(config));
  application.use(info.makeRouter(config));

  // Register error handler
  application.use(makeErrorRequestHandler(logger));

  application.set("port", serverConfig.port);
  application.set("hostname", serverConfig.hostname);
  return application;
};

export { Application, makeApplication };
