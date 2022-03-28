import * as TE from "fp-ts/TaskEither";
import * as f from "fp-ts/lib/function";
import * as oidc from "oidc-provider";
import { FederationToken, Identity } from "../identities/domain";
import { IdentityService } from "../identities/service";
import { Config } from "../config";

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

const defaultConfiguration = (
  adapter: (name: string) => oidc.Adapter
): oidc.Configuration => {
  // use a named function because of https://github.com/panva/node-oidc-provider/issues/799
  // :D
  function adaptTheAdapterFun(str: string) {
    return adapter(str);
  }
  return {
    ...{ adapter: adaptTheAdapterFun },
    claims: {
      profile: ["family_name", "given_name", "name"],
    },
    extraClientMetadata: {
      properties: ["bypass_consent", "organization", "serviceId"],
    },
    features: {
      devInteractions: {
        enabled: false,
      },
      registration: {
        enabled: true,
        initialAccessToken: false,
        issueRegistrationAccessToken: false,
      },
      registrationManagement: {
        enabled: true,
        rotateRegistrationAccessToken: false,
      },
      rpInitiatedLogout: {
        enabled: false,
      },
      userinfo: {
        enabled: false,
      },
    },
    responseTypes: ["id_token"],
    routes: {
      authorization: "/oauth/authorize",
      registration: "/admin/clients",
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
 * Return an instance of oidc-provider Provider ready to be used.
 *
 * @param providerConfiguration: The configuration used to configure the provider,
 *  this parameter is used to override configuration on tests, for production keep the default one.
 * @param identityService: The IdentityService used to authenticate the user.
 * @returns An instance of oidc-provider Provider.
 */
const makeProvider = (
  config: Config,
  identityService: IdentityService,
  providerConfiguration: oidc.Configuration
): oidc.Provider => {
  const providerConfig: oidc.Configuration = {
    ...providerConfiguration,
    findAccount: findAccountAdapter(identityService),
  };
  return new oidc.Provider(
    `https://${config.server.hostname}:${config.server.port}`,
    providerConfig
  );
};

export { makeProvider, userInfoToAccount, defaultConfiguration };
