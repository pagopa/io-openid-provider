import express from "express";
import { Config } from "src/config";
import * as u from "src/userinfo";
import * as interactions from "../interactions/router";
import * as l from "../logger";
import * as p from "./provider";

const makeRouter = (
  config: Config,
  userInfoClient: u.UserInfoClient,
  dbInMemory: boolean
): express.Router => {
  const provider = p.makeProvider(config, userInfoClient, dbInMemory);

  const router = express.Router();

  router.use(
    interactions.makeRouter(provider)(userInfoClient)(
      l.makeLogger(config.logger)
    )
  );

  router.use("/", provider.callback());

  return router;
};

export { makeRouter };
