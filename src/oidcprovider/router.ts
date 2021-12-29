import express from "express";
import * as oidc from "oidc-provider";
import * as cp from "cookie-parser";
import * as t from "io-ts";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";
import { Config } from "src/config";

const Authorized = t.type({
  login: t.type({
    accountId: t.string,
  }),
});
type Authorized = t.TypeOf<typeof Authorized>;

const Unauthorized = t.type({
  // an error field used as error code indicating a failure during the interaction
  // TODO: Improve type
  error: t.string,

  // an optional description for this error
  // TODO: Improve type
  error_description: t.string,
});
type Unauthorized = t.TypeOf<typeof Unauthorized>;

// TODO: Take the correct error (see the RFC)
const unauthorizedError: Unauthorized = {
  error: "unauthorized",
  error_description: "not authorized",
};

// TODO: Customize to call IO backend
const validateFederationToken = (
  token: string
): TE.TaskEither<Unauthorized, Authorized> =>
  pipe(
    TE.of(token),
    TE.filterOrElse(
      (_) => _ === "123",
      (_) => unauthorizedError
    ),
    TE.map((_) => ({
      login: {
        accountId: "ididididid",
      },
    }))
  );

// TODO: Move to environment
const cookieKey = "X-Federation-Token";
const extractFederationToken = (req: express.Request) =>
  pipe(
    E.tryCatch(() => req.cookies[cookieKey], String),
    E.mapLeft((_errorMessage) => unauthorizedError),
    E.chain(
      flow(
        t.string.decode,
        E.mapLeft((_errors) => unauthorizedError)
      )
    )
  );

// related to https://github.com/panva/node-oidc-provider/blob/main/docs/README.md#interactionspolicy
// TODO: Refactor
const interactionHandler =
  (provider: oidc.Provider): express.Handler =>
  (req, res, next) =>
    pipe(
      TE.tryCatch(() => provider.interactionDetails(req, res), String),
      TE.map((detail) => {
        // eslint-disable-next-line sonarjs/no-small-switch
        switch (detail.prompt.name) {
          case "login":
            return pipe(
              TE.fromEither(extractFederationToken(req)),
              TE.chain((token) => validateFederationToken(token)),
              TE.fold(
                (left) => () => provider.interactionFinished(req, res, left),
                (right) => () => provider.interactionFinished(req, res, right)
              )
            )();
          default:
            return next();
        }
      })
    )();

const fakeFindAccount: oidc.FindAccount = (_ctx, id): Promise<oidc.Account> =>
  pipe(
    TE.of({
      accountId: id,
      claims: (_use: string, _scope: string) => ({ sub: id }),
    }),
    TE.toUnion
  )();

const makeProviderConfig = (_config: Config): oidc.Configuration => ({
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
  findAccount: fakeFindAccount,
  responseTypes: ["id_token"],
  routes: {
    authorization: "/oauth/authorize",
  },
  scopes: ["openid"],
  tokenEndpointAuthMethods: ["none"],
});

const makeProvider = (config: Config): oidc.Provider =>
  new oidc.Provider(
    `https://${config.server.hostname}:${config.server.port}`,
    makeProviderConfig(config)
  );

const makeRouter = (config: Config): express.Router => {
  const provider = makeProvider(config);

  const router = express.Router();

  router.use(cp.default());
  router.get("/interaction/:uid", interactionHandler(provider));

  router.use("/", provider.callback());

  return router;
};

export { makeRouter };
