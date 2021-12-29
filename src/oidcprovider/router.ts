import express from "express";
import * as oidc from "oidc-provider";
import * as t from "io-ts";
import * as E from "fp-ts/Either";
import * as T from "fp-ts/Task";
import * as TE from "fp-ts/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";
import { Config } from "src/config";
import * as u from "src/userinfo";

// TODO: Move to environment
const cookieKey = "X-IO-Federation-Token";
const extractFederationToken = (
  req: express.Request
): E.Either<oidc.InteractionResults, string> =>
  pipe(
    E.tryCatch(() => req.cookies[cookieKey], String),
    E.chainW(t.string.decode),
    E.mapLeft((_) => ({
      error: "unauthorized",
    }))
  );

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

// eslint-disable-next-line extra-rules/no-commented-out-code
// TODO: Refactor
const interactionHandler =
  (
    provider: oidc.Provider,
    userInfoClient: u.UserInfoClient
  ): express.Handler =>
  (req, res, next) =>
    pipe(
      TE.tryCatch(() => provider.interactionDetails(req, res), String),
      TE.map((detail) => {
        // eslint-disable-next-line sonarjs/no-small-switch
        switch (detail.prompt.name) {
          case "login":
            return pipe(
              // extract the token from request
              TE.fromEither(extractFederationToken(req)),
              // find the user given the token
              TE.chain(
                flow(
                  userInfoClient.findUserByFederationToken,
                  TE.mapLeft(userInfoClientErrorToInteractionResults)
                )
              ),
              TE.map(userInfoToInteractionResults),
              TE.toUnion,
              // resolve the interaction with the given result
              T.map((result) => provider.interactionFinished(req, res, result))
            )();
          default:
            return next();
        }
      })
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

export { makeRouter };
