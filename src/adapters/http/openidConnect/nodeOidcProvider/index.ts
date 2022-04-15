import { pipe } from "fp-ts/function";
import * as TE from "fp-ts/TaskEither";
import * as oidc from "oidc-provider";
import { ClientService } from "../../../../domain/clients/ClientService";
import { Config } from "../../../../config";
import { Logger } from "../../../../domain/logger";
import { InteractionService } from "../../../../domain/interactions/InteractionService";
import { SessionService } from "../../../../domain/sessions/SessionService";
import { GrantService } from "../../../../domain/grants/GrantService";
import { IdentityService } from "../../../../domain/identities/IdentityService";
import { Identity } from "../../../../domain/identities/types";
import { LoginUseCase } from "../../../../domain/useCases/LoginUseCase";
import { makeAdapterProvider } from "./AdapterProvider";
import { disableAuthClientsEndpointMiddleware } from "./middlewares";

export const makeAccountClaims = (identity: Identity): oidc.AccountClaims => ({
  family_name: identity.familyName,
  given_name: identity.givenName,
  name: `${identity.givenName} ${identity.familyName}`,
  sub: identity.fiscalCode,
});

const findAccountAdapter =
  (
    authenticationCookieKey: string,
    logger: Logger,
    identityService: IdentityService
  ): oidc.FindAccount =>
  (ctx, _sub, _token) => {
    const accountId = ctx.oidc.session?.accountId;
    const accessToken = ctx.cookies.get(authenticationCookieKey);
    if (accountId && accessToken) {
      return {
        accountId,
        claims: (_use, _scope, _claims, _rejected) =>
          pipe(
            LoginUseCase(logger, identityService)(accessToken),
            TE.map(makeAccountClaims),
            TE.fold(
              (_) => () => Promise.reject(_),
              (claims) => () => Promise.resolve(claims)
            )
          )(),
      };
    } else {
      logger.debug(
        `findAccountAdapter: cookie (${authenticationCookieKey}) or account not found`
      );
      return undefined;
    }
  };

export const makeConfiguration = (
  config: Config,
  logger: Logger,
  identityService: IdentityService,
  clientService: ClientService,
  interactionService: InteractionService,
  sessionService: SessionService,
  grantService: GrantService
  // eslint-disable-next-line max-params
): oidc.Configuration => {
  // use a named function because of https://github.com/panva/node-oidc-provider/issues/799
  function adaptTheAdapterFun(str: string) {
    return makeAdapterProvider(
      logger,
      clientService,
      interactionService,
      sessionService,
      grantService
    )(str);
  }

  return {
    adapter: adaptTheAdapterFun,
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
    findAccount: findAccountAdapter(
      config.server.authenticationCookieKey,
      logger,
      identityService
    ),
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
 * @returns An instance of oidc-provider Provider.
 */
export const makeProvider = (
  config: Config,
  providerConfig: oidc.Configuration
) => {
  const provider = new oidc.Provider(
    `https://${config.server.hostname}:${config.server.port}`,
    providerConfig
  );
  // Add the middleware that disable the authorization on the
  // clients management endpoints.
  // This middleware toghether with a fake RegistrationAccessTokenAdapter disable
  // the authentication on clients paths. Ugly solution but works ..
  provider.use(disableAuthClientsEndpointMiddleware(providerConfig));

  return provider;
};
