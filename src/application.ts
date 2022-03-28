import * as path from "path";
import express from "express";
import helmet from "helmet";
import { Provider } from "oidc-provider";
import * as cookies from "cookie-parser";
import * as info from "./info/router";
import * as clients from "./implementations/http/clientRouter";
import * as oidcprovider from "./oidcprovider/router";
import * as interactions from "./interactions/router";
import { Config } from "./config";
import { Logger } from "./logger";
import { ProviderService } from "./interactions/service";
import { IdentityService } from "./identities/service";
import { ClientRepository } from "./core/repositories/ClientRepository";

// eslint-disable-next-line extra-rules/no-commented-out-code
// TODO: Remove in production
const ENABLE_HELMET = false;

type Application = express.Application;

const makeApplication = (
  config: Config,
  provider: Provider,
  providerService: ProviderService,
  identityService: IdentityService,
  clientRepository: ClientRepository,
  logger: Logger
  // eslint-disable-next-line max-params
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
  application.use(express.static(path.join(__dirname, "public")));

  // Template engine configuration
  application.set("views", path.join(__dirname, "views"));
  application.set("view engine", "ejs");

  /* Register routers */
  // router that manage the clients endpoint
  application.use(clients.makeRouter(logger, clientRepository));
  // router that manage the info endpoint
  application.use(info.makeRouter(config));
  // router that manage the interactions (login and consent)
  application.use(
    interactions.makeRouter(providerService, identityService, logger)
  );
  // router that manage the openid-connect endpoints
  application.use(oidcprovider.makeRouter(provider));

  const serverConfig = config.server;
  application.set("port", serverConfig.port);
  application.set("hostname", serverConfig.hostname);
  return application;
};

export { Application, makeApplication };
