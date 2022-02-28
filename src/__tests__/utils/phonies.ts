import * as oidc from "oidc-provider";
import * as records from "./records";
import * as application from "../../application";
import * as logger from "../../logger";
import * as mock from "jest-mock-extended";
import * as authClient from "../../generated/clients/io-auth/client";
import * as identities from "../../identities/service";
import { ProviderService } from "../../interactions/service";

const makeFakeApplication = () => {
  const config = records.validConfig;
  const mockProvider = mock.mock<oidc.Provider>();
  const mockProviderService = mock.mock<ProviderService>();
  const mockIdentityService = mock.mock<identities.IdentityService>();
  const log = logger.makeLogger(config.logger);
  // return an application with all mocked services
  const app = application.makeApplication(
    config,
    mockProvider,
    mockProviderService,
    mockIdentityService,
    log
  );
  return { mockProvider, mockProviderService, mockIdentityService, app };
};

const makeIdentityService = () => {
  const mockAuthClient = mock.mock<authClient.Client>();
  const identityService = identities.makeService(mockAuthClient);
  return { identityService, mockAuthClient };
};

export { makeFakeApplication, makeIdentityService };
