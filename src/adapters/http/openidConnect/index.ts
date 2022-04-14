/**
 * This module contains all the endpoint related
 * to the OpenID Connect protocol
 */
import express from "express";
import { AppEnv } from "..";
import { makeConfiguration, makeProvider } from "./nodeOidcProvider";
import { makeInteractionRouter } from "./nodeOidcProvider/interactions";

/**
 * Create and return a Router that manage all OpenID Connect endpoints
 */
export const makeRouter = ({
  config,
  logger,
  clientService,
  interactionService,
  identityService,
  sessionService,
  grantService,
}: AppEnv): express.Router => {
  const router = express.Router();

  const provider = makeProvider(
    config,
    makeConfiguration(
      config,
      logger,
      identityService,
      clientService,
      interactionService,
      sessionService,
      grantService
    )
  );

  router.use(
    makeInteractionRouter(
      config,
      logger,
      identityService,
      interactionService,
      clientService,
      grantService,
      provider
    )
  );

  router.use("/", provider.callback());
  return router;
};
