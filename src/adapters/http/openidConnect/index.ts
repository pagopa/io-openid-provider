/**
 * This module contains all the endpoint related
 * to the OpenID Connect protocol
 */
import express from "express";
import { AppEnv } from "../index.js";
import { makeConfiguration, makeProvider } from "./nodeOidcProvider/index.js";
import { makeInteractionRouter } from "./nodeOidcProvider/interactions.js";

/**
 * Create and return a Router that manage all OpenID Connect endpoints
 */
export const makeRouter = ({
  config,
  logger,
  useCases,
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
      useCases.authenticateUseCase,
      clientService,
      interactionService,
      sessionService,
      grantService
    )
  );

  router.use(
    makeInteractionRouter(
      config,
      useCases.processInteractionUseCase,
      useCases.confirmConsentUseCase,
      useCases.abortInteractionUseCase,
      provider
    )
  );

  router.use("/", provider.callback());
  return router;
};
