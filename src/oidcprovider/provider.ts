import * as b from "fp-ts/boolean";
import * as O from "fp-ts/Option";
import * as TE from "fp-ts/TaskEither";
import * as f from "fp-ts/lib/function";
import * as u from "src/userinfo";
import * as c from "src/config";
import * as oidc from "oidc-provider";
import * as redis from "./dal/redis";

interface Client {
  readonly clientId: string;
  readonly redirectUris: ReadonlyArray<URL>;
}

interface ProviderConfig {
  readonly testClient: O.Option<Client>;
}

const userInfoToAccount = (userInfo: u.UserInfo): oidc.Account => ({
  accountId: userInfo.id,
  claims: (_use: string, _scope: string) => ({
    sub: userInfo.id,
  }),
});

const findAccountAdapter =
  (userInfoClient: u.UserInfoClient): oidc.FindAccount =>
  (_, id) =>
    f.pipe(
      userInfoClient.findUserByFederationToken(id),
      TE.map(userInfoToAccount),
      TE.mapLeft(f.constant(undefined)),
      TE.toUnion
    )();

const features = {
  devInteractions: {
    enabled: true,
  },
  rpInitiatedLogout: {
    enabled: false,
  },
  userinfo: {
    enabled: false,
  },
};

const staticClients = (
  config: ProviderConfig
): ReadonlyArray<oidc.ClientMetadata> =>
  f.pipe(
    config.testClient,
    O.fold(f.constant([]), (client) => [
      {
        client_id: client.clientId,
        grant_types: ["implicit"],
        redirect_uris: client.redirectUris.map((_) => _.href).concat(),
        response_types: ["id_token"],
        token_endpoint_auth_method: "none",
      },
    ])
  );

const makeProvider = (
  config: c.Config,
  userInfoClient: u.UserInfoClient,
  dbInMemory: boolean
): oidc.Provider => {
  // use a named function because of https://github.com/panva/node-oidc-provider/issues/799
  function adapter(str: string) {
    return redis.makeRedisAdapter(config.redis)(str);
  }

  const adapterConfig = b.fold(
    () => ({ adapter }),
    () => ({})
  )(dbInMemory);

  const providerConfig: oidc.Configuration = {
    ...adapterConfig,
    // .concact just to transform an immutable to a mutable array
    clients: staticClients(config.provider).concat(),
    features,
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

export { ProviderConfig, makeProvider };
