import express from "express";
import helmet from "helmet";
import * as cookies from "cookie-parser";
import * as info from "./info/router";
import * as oidcprovider from "./oidcprovider/router";
import { Config } from "./config";
import { Logger } from "./logger";
import { UserInfoClient } from "./userinfo";

type Application = express.Application;

const makeApplication = (
  config: Config,
  userInfoClient: UserInfoClient,
  _logger: Logger,
  // TODO: REMOVE THE FIELD DBINMEMORY (https://pagopa.atlassian.net/browse/IOOP-30)
  dbInMemory: boolean
): Application => {
  const application = express();

  // Enable helmet
  application.use(helmet());
  // Add a middleware that parses JSON HTTP
  // request bodies into JavaScript objects
  application.use(express.json());
  // Add a middleware that parse cookies
  application.use(cookies.default());

  const serverConfig = config.server;

  // Register routers
  // application.use(component.makeRouter(service0, service1, ...));
  application.use(oidcprovider.makeRouter(config, userInfoClient, dbInMemory));
  application.use(info.makeRouter(config));

  application.set("port", serverConfig.port);
  application.set("hostname", serverConfig.hostname);
  return application;
};

export { Application, makeApplication };
