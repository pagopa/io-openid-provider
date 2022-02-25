import * as TE from "fp-ts/TaskEither";
import * as f from "fp-ts/lib/function";
import * as oidc from "oidc-provider";
import * as c from "../config";
import { FederationToken, Identity } from "../identities/domain";
import { IdentityService } from "../identities/service";
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

const makeProvider = (
  config: c.Config,
  indentityService: IdentityService
): oidc.Provider => {
  // use a named function because of https://github.com/panva/node-oidc-provider/issues/799
  function adapter(str: string) {
    return redis.makeRedisAdapter(config.redis)(str);
  }

  const providerConfig: oidc.Configuration = {
    ...{ adapter },
    claims: {
      profile: ["family_name", "given_name", "name"],
    },
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
