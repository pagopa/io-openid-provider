import express from "express";
import * as oidc from "oidc-provider";

const makeRouter = (provider: oidc.Provider): express.Router => {
  const router = express.Router();

  router.use("/", provider.callback());

  return router;
};

export { makeRouter };
