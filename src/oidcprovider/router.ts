import express from "express";
import * as oidc from "oidc-provider";
import * as O from "fp-ts/Option";
import * as T from "fp-ts/Task";
import * as TE from "fp-ts/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";
import { Config } from "src/config";
import * as u from "src/userinfo";
import * as strings from "@pagopa/ts-commons/lib/strings";
import * as p from "./provider";

// TODO: Move to environment
const cookieKey = "X-IO-Federation-Token";
const extractIOFederationToken = (req: express.Request): O.Option<string> =>
  pipe(req.cookies[cookieKey], strings.NonEmptyString.decode, O.fromEither);

const userInfoToInteractionResults = (
  userInfo: u.UserInfo
): oidc.InteractionResults => ({
  login: {
    accountId: userInfo.id,
  },
});

const userInfoClientErrorToInteractionResults = (
  error: u.UserInfoClientError
): oidc.InteractionResults => ({
  error: error.errorType,
  error_description: "Unauthorized",
});

const interactionLogic = (
  userInfoClient: u.UserInfoClient,
  req: express.Request,
  detail: oidc.PromptDetail
): T.Task<O.Option<oidc.InteractionResults>> =>
  pipe(
    O.of(detail),
    O.filter((_) => _.name === "login"),
    O.fold(
      () => T.of(O.none),
      (_) =>
        pipe(
          // extract the token from request
          extractIOFederationToken(req),
          TE.fromOption(() => ({ error: "unauthorized" })),
          // find the user given the token
          TE.chain(
            flow(
              userInfoClient.findUserByFederationToken,
              TE.mapLeft(userInfoClientErrorToInteractionResults)
            )
          ),
          TE.map(userInfoToInteractionResults),
          TE.toUnion,
          T.map(O.some)
        )
    )
  );

// eslint-disable-next-line extra-rules/no-commented-out-code
// TODO: Refactor
const interactionHandler =
  (
    provider: oidc.Provider,
    userInfoClient: u.UserInfoClient
  ): express.Handler =>
  (req, res, next) =>
    pipe(
      () => provider.interactionDetails(req, res),
      T.chain((interaction) =>
        interactionLogic(userInfoClient, req, interaction.prompt)
      ),
      T.chain(
        O.fold(
          () => () => Promise.reject(next()),
          (result) => () => provider.interactionFinished(req, res, result)
        )
      )
    )();

const makeRouter = (
  config: Config,
  userInfoClient: u.UserInfoClient,
  dbInMemory: boolean
): express.Router => {
  const provider = p.makeProvider(config, userInfoClient, dbInMemory);

  const router = express.Router();

  router.get("/interaction/:uid", interactionHandler(provider, userInfoClient));

  router.use("/", provider.callback());

  return router;
};

export { makeRouter, extractIOFederationToken, interactionLogic };
