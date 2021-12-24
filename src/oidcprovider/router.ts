import express from "express";
import * as oidc from "oidc-provider";
import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/TaskEither";
import { Config } from "src/config";

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

  router.use("/", provider.callback());

  return router;
};

export { makeRouter };
