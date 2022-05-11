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
  authenticateUseCase,
  processInteractionUseCase,
  confirmConsentUseCase,
  abortInteractionUseCase,
  clientService,
  interactionService,
  sessionService,
  grantService,
}: AppEnv): express.Router => {
  const router = express.Router();

  const provider = makeProvider(
    config,
    makeConfiguration(
      config,
      logger,
      authenticateUseCase,
      clientService,
      interactionService,
      sessionService,
      grantService
    )
  );

  router.use(
    makeInteractionRouter(
      config,
      processInteractionUseCase,
      confirmConsentUseCase,
      abortInteractionUseCase,
      provider
    )
  );

  router.use("/", provider.callback());
  return router;
};
