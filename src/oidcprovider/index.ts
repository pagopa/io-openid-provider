import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as TE from "fp-ts/TaskEither";
import * as oidc from "oidc-provider";
import { GrantRepository } from "src/core/repositories/GrantRepository";
import { FederationToken, Identity } from "../identities/domain";
import { IdentityService } from "../identities/service";
import { Config } from "../config";
import { Logger } from "../logger";
import { AccountId, ClientId } from "../core/domain";
import { taskEitherToPromise } from "./adapters/utils";

const userInfoToAccount = (identity: Identity): oidc.Account => ({
  accountId: identity.fiscalCode,
  // https://github.com/panva/node-oidc-provider/blob/main/docs/README.md#findaccount
  claims: (_use, _scope, _claims, _rejected) => ({
    family_name: identity.familyName,
    given_name: identity.givenName,
    name: `${identity.givenName} ${identity.familyName}`,
    sub: identity.fiscalCode,
  }),
});

const findAccountAdapter =
  (authenticationCookieKey: string) =>
  (logger: Logger) =>
  (identityService: IdentityService): oidc.FindAccount =>
  (ctx, _sub, _token) =>
    pipe(
      FederationToken.decode(ctx.cookies.get(authenticationCookieKey)),
      TE.fromEither,
      TE.orElseFirst((_) =>
        TE.of(
          logger.info(
            `Cookie not found or invalid on key ${authenticationCookieKey}`
          )
        )
      ),
      TE.chainW((parsed) => identityService.authenticate(parsed)),
      TE.bimap(
        (_error) => undefined,
        (identity) => userInfoToAccount(identity)
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
      properties: ["bypass_consent", "organization_id", "service_id"],
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
 * Return an option with the value to put on authorization header.
 */
export const makeAuthorizationHeader = (
  config: oidc.Configuration,
  url: string
): O.Option<string> =>
  pipe(
    O.fromNullable(config.routes),
    O.chain((routes) => O.fromNullable(routes.registration)),
    O.filter((route) => url.startsWith(`${route}/`)),
    O.map((route) => url.replace(`${route}/`, "")),
    O.filter((clientId) => clientId !== ""),
    O.map((clientId) => `Bearer ${clientId}`)
  );

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
  logger: Logger,
  identityService: IdentityService,
  grantRepository: GrantRepository,
  providerConfiguration: oidc.Configuration
): oidc.Provider => {
  const providerConfig: oidc.Configuration = {
    ...providerConfiguration,
    findAccount: findAccountAdapter(config.server.authenticationCookieKey)(
      logger
    )(identityService),
    loadExistingGrant: (ctx) => {
      const grantId = ctx.oidc.result?.consent?.grantId;
      const clientId = ctx.oidc.client?.clientId as ClientId;
      const accountId = ctx.oidc.account?.accountId as AccountId;
      // ctx.oidc.session?.grantIdFor(ctx.oidc.client?.clientId as string);
      if (grantId) {
        // load using the grantId
        return ctx.oidc.provider.Grant.find(grantId);
      } else if (clientId && accountId) {
        // load using clientId & accountId
        const result = pipe(
          grantRepository.findRemember(clientId, accountId),
          TE.map(
            O.map((grant) => {
              const newGrant = new ctx.oidc.provider.Grant({
                accountId: grant.accountId,
                clientId: grant.clientId,
              });
              // eslint-disable-next-line functional/immutable-data
              newGrant.jti = grant.id;
              return newGrant;
            })
          ),
          TE.map(O.toUndefined)
        );
        return taskEitherToPromise(result);
      } else {
        return undefined;
      }
    },
  };
  const provider = new oidc.Provider(
    `https://${config.server.hostname}:${config.server.port}`,
    providerConfig
  );

  // This middleware add the following authorization header on clients path
  // `Bearer ${clientId}`
  // This trick toghether with a fake RegistrationAccessTokenAdapter disable
  // the authentication on clients paths.
  provider.use((ctx, next) => {
    pipe(
      makeAuthorizationHeader(providerConfig, ctx.url),
      O.map((authorization) => {
        // eslint-disable-next-line functional/immutable-data
        ctx.headers.authorization = authorization;
      })
    );
    return next();
  });

  return provider;
};

export { makeProvider, userInfoToAccount, defaultConfiguration };
