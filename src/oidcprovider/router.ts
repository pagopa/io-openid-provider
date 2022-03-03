// TODO: This file can be removed, use `app.use("/", provider.callback());` in src/application.ts
import express from "express";
import * as oidc from "oidc-provider";

/**
 * Return the router that manage the endpoints managed by the given provider.
 * For more information check https://github.com/panva/node-oidc-provider/blob/main/docs/README.md#routes
 * Not all the endpoint are available, depends on how the Provider is configured.
 */
const makeRouter = (provider: oidc.Provider): express.Router => {
  const router = express.Router();

  router.use("/", provider.callback());

  return router;
};

export { makeRouter };
