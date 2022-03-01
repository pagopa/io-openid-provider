import * as mock from "jest-mock-extended";
import * as oidc from "oidc-provider";
import * as records from "./records";
import * as application from "../../application";
import * as logger from "../../logger";
import * as authClient from "../../generated/clients/io-auth/client";
import * as interactions from "../../interactions/service";
import * as identities from "../../identities/service";
import * as oidcprovider from "../../oidcprovider";

// Create a fake application used to run some test
// usually tests of routers, you need to mock the services,
// expect the provider
const makeFakeApplication = () => {
  const config = records.validConfig;
  const { client, clientSkipConsent, provider, mockIdentityService } =
    makeLocalProvider();
  const log = logger.makeLogger(config.logger);
  const mockProviderService = interactions.makeService(provider, log);
  // return an application with all mocked services
  const app = application.makeApplication(
    config,
    provider,
    mockProviderService,
    mockIdentityService,
    log
  );
  return {
    client,
    clientSkipConsent,
    mockProviderService,
    mockIdentityService,
    app,
  };
};

// Create a provider to use during tests.
// This provider use a in-memory database.
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
    ...oidcprovider.defaultConfiguration(records.validConfig),
    adapter: undefined,
    clients: [client, clientSkipConsent],
  };
  const provider = oidcprovider.makeProvider(
    records.validConfig,
    mockIdentityService,
    overridenConfiguration
  );
  return { provider, client, clientSkipConsent, mockIdentityService };
};

const makeIdentityService = () => {
  const mockAuthClient = mock.mock<authClient.Client>();
  const identityService = identities.makeService(mockAuthClient);
  return { identityService, mockAuthClient };
};

export { makeFakeApplication, makeIdentityService, makeLocalProvider };
