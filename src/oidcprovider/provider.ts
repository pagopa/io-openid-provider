import * as b from "fp-ts/boolean";
import * as O from "fp-ts/Option";
import * as TE from "fp-ts/TaskEither";
import * as f from "fp-ts/lib/function";
import * as u from "src/userinfo";
import * as c from "src/config";
import * as oidc from "oidc-provider";
import * as redis from "./dal/redis";

interface ProviderConfig {
  readonly testClientId: O.Option<string>;
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

// eslint-disable-next-line functional/prefer-readonly-type
const staticClients = (config: ProviderConfig): oidc.ClientMetadata[] =>
  f.pipe(
    config.testClientId,
    O.fold(f.constant([]), (clientId) => [
      {
        client_id: clientId,
        grant_types: ["implicit"],
        redirect_uris: ["https://client.example.org/cb"],
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
    clients: staticClients(config.provider),
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
