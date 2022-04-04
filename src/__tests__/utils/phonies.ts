import * as mock from "jest-mock-extended";
import * as oidc from "oidc-provider";
import * as records from "./records";
import * as application from "../../application";
import * as logger from "../../logger";
import * as authClient from "../../generated/clients/io-auth/client";
import * as interactions from "../../interactions/service";
import * as identities from "../../identities/service";
import * as oidcprovider from "../../oidcprovider";
import { ClientRepository } from "../../core/repositories/ClientRepository";

/**
 * Create and return a fake application and the mocks required by the system.
 * The returned mocks are not instructed.
 */
const makeFakeApplication = () => {
  const config = records.validConfig;
  const { client, clientSkipConsent, provider, mockIdentityService } =
    makeLocalProvider();
  const log = logger.makeLogger(config.logger);
  const mockProviderService = interactions.makeService(provider, log);
  const mockClientRepository = mock.mock<ClientRepository>();
  // return an application with all mocked services
  const app = application.makeApplication(
    config,
    provider,
    mockProviderService,
    mockIdentityService,
    mockClientRepository,
    log
  );
  return {
    client,
    clientSkipConsent,
    mockProviderService,
    mockIdentityService,
    provider,
    app,
  };
};

/**
 * Create a provider for test purposes. This provider uses the in-memory
 * database provided by the library oidc-provider.
 */
const makeLocalProvider = () => {
  const client: oidc.ClientMetadata = {
    client_id: "client-id",
    grant_types: ["implicit"],
    redirect_uris: ["https://callback/cb"],
    response_types: ["id_token"],
    token_endpoint_auth_method: "none",
  };
  const clientSkipConsent = {
    ...client,
    client_id: "client-skip-consent",
    bypass_consent: true,
  };
  const mockIdentityService = mock.mock<identities.IdentityService>();
  const overridenConfiguration = {
    ...oidcprovider.defaultConfiguration({} as any),
    adapter: undefined,
    clients: [client, clientSkipConsent],
  };
  const provider = oidcprovider.makeProvider(
    records.validConfig,
    logger.makeLogger(records.validConfig.logger),
    mockIdentityService,
    overridenConfiguration
  );
  return { provider, client, clientSkipConsent, mockIdentityService };
};

/**
 * Create and return an IdentityService and its mocks. The mocks are not instructed.
 */
const makeIdentityService = () => {
  const mockAuthClient = mock.mock<authClient.Client>();
  const identityService = identities.makeService(mockAuthClient);
  return { identityService, mockAuthClient };
};

export { makeFakeApplication, makeIdentityService, makeLocalProvider };
