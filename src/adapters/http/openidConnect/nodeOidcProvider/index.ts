import { pipe } from "fp-ts/lib/function.js";
import * as E from "fp-ts/lib/Either.js";
import * as TE from "fp-ts/lib/TaskEither.js";
import Provider from "oidc-provider";
import * as oidc from "oidc-provider";
import { ClientService } from "../../../../domain/clients/ClientService.js";
import { Config } from "../../../../config.js";
import { Logger } from "../../../../domain/logger/index.js";
import { InteractionService } from "../../../../domain/interactions/InteractionService.js";
import { SessionService } from "../../../../domain/sessions/SessionService.js";
import { GrantService } from "../../../../domain/grants/GrantService.js";
import { Identity } from "../../../../domain/identities/types.js";
import { AuthenticateUseCase } from "../../../../useCases/AuthenticateUseCase.js";
import {
  Client,
  OrganizationId,
  ServiceId,
} from "../../../../domain/clients/types.js";
import { show } from "../../../../domain/utils.js";
import { makeAdapterProvider } from "./AdapterProvider.js";
import {
  disableAuthClientsEndpointMiddleware,
  updateDiscoveryResponseMiddleware,
} from "./middlewares.js";

export const makeAccountClaims = (identity: Identity): oidc.AccountClaims => ({
  acr: identity.acr,
  auth_time: identity.authTime,
  date_of_birth: identity.dateOfBirth,
  email_verified: identity.email,
  family_name: identity.familyName,
  given_name: identity.givenName,
  name: `${identity.givenName} ${identity.familyName}`,
  sub: identity.fiscalCode,
});

const findAccountAdapter =
  (
    authenticationCookieKey: string,
    logger: Logger,
    authenticateUseCase: AuthenticateUseCase
  ): oidc.FindAccount =>
  (ctx) => {
    const accountId = ctx.oidc.session?.accountId;
    const accessToken = ctx.cookies.get(authenticationCookieKey);
    if (accountId && accessToken) {
      return {
        accountId,
        claims: () =>
          pipe(
            authenticateUseCase(accessToken),
            TE.map(makeAccountClaims),
            TE.fold(
              (error) => () => Promise.reject(error),
              (claims) => () => Promise.resolve(claims)
            )
          )(),
      };
    } else {
      logger.error(
        `findAccountAdapter: cookie (${authenticationCookieKey}) or account not found`
      );
      return undefined;
    }
  };

export const makeConfiguration = (
  config: Config,
  logger: Logger,
  authenticateUseCase: AuthenticateUseCase,
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
      acr: ["acr"],
      auth_time: ["auth_time"],
      date_of_birth: ["date_of_birth"],
      email_verified: ["email_verified"],
      family_name: ["family_name"],
      given_name: ["given_name"],
      name: ["family_name", "given_name"],
      openid: ["sub"],
      profile: ["family_name", "given_name", "name"],
      sub: ["sub"],
    },
    cookies: {
      keys: [config.server.cookiesKey],
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
        idFactory: (ctx) =>
          pipe(
            E.of(
              (organizationId: OrganizationId) => (serviceId: ServiceId) =>
                Client.props.clientId.encode({ organizationId, serviceId })
            ),
            E.ap(OrganizationId.decode(ctx.oidc.body?.organization_id)),
            E.ap(ServiceId.decode(ctx.oidc.body?.service_id)),
            E.getOrElseW((err) => {
              logger.error(`Some error during client_id factory ${show(err)}`);
              throw new Error(show(err));
            })
          ),
        initialAccessToken: false,
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
      authenticateUseCase
    ),
    jwks: {
      keys: [JSON.parse(config.server.jwkPrimary)].concat(
        config.server.jwkSecondary
          ? [JSON.parse(config.server.jwkSecondary)]
          : []
      ),
    },
    responseTypes: ["id_token"],
    routes: {
      authorization: "/oauth/authorize",
      registration: "/clients",
    },
    scopes: ["openid"],
    ttl: {
      Grant: config.features.grant.grantTTL,
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
  const provider = new Provider(config.issuer.href, providerConfig);
  // Add the middleware that disable the authorization on the
  // clients management endpoints.
  // This middleware toghether with a fake RegistrationAccessTokenAdapter disable
  // the authentication on clients paths. Ugly solution but works ..
  provider.use(disableAuthClientsEndpointMiddleware(providerConfig));

  // Add the middleware that remove some fields from response of discovert endpoint
  provider.use(updateDiscoveryResponseMiddleware);

  provider.proxy = config.server.enableProxy;

  return provider;
};
