import * as f from "fp-ts/function";
import * as records from "./records";
import * as application from "../../application";
import * as userinfo from "../../userinfo";
import * as logger from "../../logger";
import * as mock from "jest-mock-extended";
import * as authClient from "../../generated/clients/io-auth/client";
import * as S from "../../userinfo/ioUserInfoClient";
import { ErrorType, UserInfoClientError } from "../../userinfo";
import { Provider } from "oidc-provider";
import { IdentityService } from "../../identities/service";
import { ProviderService } from "../../interactions/service";

const makeFakeApplication = () => {
  const config = records.validConfig;
  const mockUserInfoClient = makeMockUserInfoClient();
  const log = logger.makeLogger(config.logger);
  // return an application with all mocked services
  const { identityService, providerService } = makeMockServices();
  return f.tuple(
    mockUserInfoClient,
    application.makeApplication(
      config,
      makeMockProvider(),
      providerService,
      identityService,
      log
    )
  );
};

const makeMockUserInfoClient = () => {
  return mock.mock<userinfo.UserInfoClient>();
};

const makeMockProvider = () => {
  return mock.mock<Provider>();
};

const makeMockServices = () => {
  const mockClient = mock.mock<authClient.Client>();
  const service = S.makeIOUserInfoClient(mockClient);
  const identityService = mock.mock<IdentityService>();
  const providerService = mock.mock<ProviderService>();
  return { service, identityService, providerService, mockClient };
};

const getExpectedError = (type: ErrorType): UserInfoClientError => ({
  errorType: type,
});

export {
  makeFakeApplication,
  makeMockUserInfoClient,
  makeMockServices,
  getExpectedError,
};
