import * as TE from "fp-ts/TaskEither";
import * as f from "fp-ts/lib/function";
import * as oidc from "oidc-provider";
import { FederationToken, Identity } from "../identities/domain";
import { IdentityService } from "../identities/service";
import { Config } from "../config";
import * as redis from "./dal/redis";

const userInfoToAccount =
  (federationToken: string) =>
  (identity: Identity): oidc.Account => ({
    accountId: federationToken,
    // https://github.com/panva/node-oidc-provider/blob/main/docs/README.md#findaccount
    claims: (_use, _scope, _claims, _rejected) => ({
      family_name: identity.familyName,
      given_name: identity.givenName,
      name: `${identity.givenName} ${identity.familyName}`,
      sub: identity.fiscalCode,
    }),
  });

const findAccountAdapter =
  (identityService: IdentityService): oidc.FindAccount =>
  (_, accountId) =>
    f.pipe(
      FederationToken.decode(accountId),
      TE.fromEither,
      TE.chainW((parsed) => identityService.authenticate(parsed)),
      TE.bimap(
        (_error) => undefined,
        (identity) => userInfoToAccount(accountId)(identity)
      ),
      TE.toUnion
    )();

const features = {
  devInteractions: {
    enabled: false,
  },
  registration: {
    enabled: true,
    issueRegistrationAccessToken: false,
  },
  rpInitiatedLogout: {
    enabled: false,
  },
  userinfo: {
    enabled: false,
  },
};

/**
 * @param testClient: A static client used on tests
 * @param storageInMemory: If true use a in-memory database (used only on tests)
 *                         otherwise use redis as database
 */
const makeProvider = (
  config: Config,
  indentityService: IdentityService,
  // these two parameters are used on tests
  testClients: ReadonlyArray<oidc.ClientMetadata> | undefined = undefined,
  storageInMemory: boolean = false
): oidc.Provider => {
  // use a named function because of https://github.com/panva/node-oidc-provider/issues/799
  function adapter(str: string) {
    return redis.makeRedisAdapter(config.redis)(str);
  }

  const providerConfig: oidc.Configuration = {
    ...(storageInMemory ? {} : { adapter }),
    claims: {
      profile: ["family_name", "given_name", "name"],
    },
    clients: testClients ? testClients.concat() : undefined,
    extraClientMetadata: {
      properties: ["bypass_consent"],
    },
    features,
    findAccount: findAccountAdapter(indentityService),
    responseTypes: ["id_token"],
    routes: {
      authorization: "/oauth/authorize",
      registration: "/connect/register",
    },
    scopes: ["openid", "profile"],
    tokenEndpointAuthMethods: ["none"],
    ttl: {
      Interaction: 60 * 5,
      Session: 60,
    },
  };
  return new oidc.Provider(
    `https://${config.server.hostname}:${config.server.port}`,
    providerConfig
  );
};

export { makeProvider, userInfoToAccount };
