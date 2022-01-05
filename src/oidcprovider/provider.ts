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
}

interface ProviderConfig {
  readonly staticClient: O.Option<Client>;
}

const userInfoToAccount = (userInfo: u.UserInfo): oidc.Account => ({
  accountId: userInfo.id,
  claims: (_use: string, _scope: string) => ({
    sub: userInfo.id,
  }),
});

const findAccountAdapter =
  (userInfoClient: u.UserInfoClient): oidc.FindAccount =>
  (_ctx, id) =>
    f.pipe(
      userInfoClient.findUserByFederationToken(id),
      TE.map(userInfoToAccount),
      TE.mapLeft((_) => undefined),
      TE.toUnion
    )();

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

  const staticClients = f.pipe(
    config.provider.staticClient,
    O.map(
      (client) =>
        ({
          client_id: client.clientId,
          grant_types: ["implicit"],
          redirect_uris: ["https://client.example.org/cb"],
          response_types: ["id_token"],
          token_endpoint_auth_method: "none",
        } as oidc.ClientMetadata)
    ),
    O.fold(
      () => [],
      (client) => [client]
    )
  );

  const providerConfig: oidc.Configuration = {
    ...adapterConfig,
    clients: staticClients,
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

export { ProviderConfig, makeProvider };
