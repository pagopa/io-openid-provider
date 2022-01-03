import express from "express";
import * as oidc from "oidc-provider";
import * as O from "fp-ts/Option";
import * as T from "fp-ts/Task";
import * as TE from "fp-ts/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";
import { Config } from "src/config";
import * as u from "src/userinfo";
import * as strings from "@pagopa/ts-commons/lib/strings";

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
  error_description: "Not authorized",
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
          T.map((_) => O.some(_))
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

const userInfoToAccount = (userInfo: u.UserInfo): oidc.Account => ({
  accountId: userInfo.id,
  claims: (_use: string, _scope: string) => ({
    sub: userInfo.id,
  }),
});

const findAccountAdapter =
  (userInfoClient: u.UserInfoClient): oidc.FindAccount =>
  (_ctx, id) =>
    pipe(
      userInfoClient.findUserByFederationToken(id),
      TE.map(userInfoToAccount),
      TE.mapLeft((_) => undefined),
      TE.toUnion
    )();

const makeProvider = (
  config: Config,
  userInfoClient: u.UserInfoClient
): oidc.Provider => {
  const providerConfig: oidc.Configuration = {
    clients: [
      {
        client_id: "foo",
        client_secret: "bar",
        grant_types: ["implicit"],
        redirect_uris: ["https://client.example.org/cb"],
        response_types: ["id_token"],
        token_endpoint_auth_method: "none",
      },
    ],
    features: {
      devInteractions: {
        enabled: true,
      },
      rpInitiatedLogout: {
        enabled: false,
      },
      userinfo: {
        enabled: false,
      },
    },
    findAccount: findAccountAdapter(userInfoClient),
    responseTypes: ["id_token"],
    routes: {
      authorization: "/oauth/authorize",
    },
    scopes: ["openid"],
    tokenEndpointAuthMethods: ["none"],
  };
  return new oidc.Provider(
    `https://${config.server.hostname}:${config.server.port}`,
    providerConfig
  );
};

const makeRouter = (
  config: Config,
  userInfoClient: u.UserInfoClient
): express.Router => {
  const provider = makeProvider(config, userInfoClient);

  const router = express.Router();

  router.get("/interaction/:uid", interactionHandler(provider, userInfoClient));

  router.use("/", provider.callback());

  return router;
};

export { makeRouter, extractIOFederationToken, interactionLogic };
