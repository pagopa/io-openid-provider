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

const defaultConfiguration = (config: Config): oidc.Configuration => {
  // use a named function because of https://github.com/panva/node-oidc-provider/issues/799
  function adapter(str: string) {
    return redis.makeRedisAdapter(config.redis)(str);
  }
  return {
    ...{ adapter },
    claims: {
      profile: ["family_name", "given_name", "name"],
    },
    extraClientMetadata: {
      properties: ["bypass_consent"],
    },
    features,
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
};

/**
 * @param providerConfiguration: The configuration used to configure the provider,
 *                               this parameter is used to override configuration on
 *                               tests, for production use the default one.
 */
const makeProvider = (
  config: Config,
  indentityService: IdentityService,
  // this parameter is used to override configuration on tests
  // for production use the default one!
  providerConfiguration: oidc.Configuration = defaultConfiguration(config)
): oidc.Provider => {
  const providerConfig: oidc.Configuration = {
    ...providerConfiguration,
    findAccount: findAccountAdapter(indentityService),
  };
  return new oidc.Provider(
    `https://${config.server.hostname}:${config.server.port}`,
    providerConfig
  );
};

export { makeProvider, userInfoToAccount, defaultConfiguration };
