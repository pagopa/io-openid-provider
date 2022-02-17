import * as path from "path";
import express from "express";
import helmet from "helmet";
import * as cookies from "cookie-parser";
import * as info from "./info/router";
import * as oidcprovider from "./oidcprovider/router";
import { Config } from "./config";
import { Logger } from "./logger";
import { UserInfoClient } from "./userinfo";

// TODO: Remove in production
const ENABLE_HELMET = false;

type Application = express.Application;

const makeApplication = (
  config: Config,
  userInfoClient: UserInfoClient,
  logger: Logger,
  // TODO: REMOVE THE FIELD DBINMEMORY (https://pagopa.atlassian.net/browse/IOOP-30)
  dbInMemory: boolean
): Application => {
  const application = express();

  // Enable helmet
  if (ENABLE_HELMET) {
    application.use(helmet());
  }
  // Add a middleware that parses JSON HTTP
  // request bodies into JavaScript objects
  application.use(express.json());
  // Add a middleware that parse cookies
  application.use(cookies.default());
  // Serve static files
  application.use(express.static(path.join(__dirname, "../public")));

  // Template engine configuration
  application.set("views", path.join(__dirname, "../views"));
  application.set("view engine", "ejs");

  const serverConfig = config.server;

  // Register routers
  // application.use(component.makeRouter(service0, service1, ...));
  application.use(
    oidcprovider.makeRouter(config, userInfoClient, logger, dbInMemory)
  );
  application.use(info.makeRouter(config));

  application.set("port", serverConfig.port);
  application.set("hostname", serverConfig.hostname);
  return application;
};

export { Application, makeApplication };
