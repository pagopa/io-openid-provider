import * as f from "fp-ts/function";
import * as records from "./records";
import * as application from "../../application";
import * as userinfo from "../../userinfo";
import * as logger from "../../logger";
import * as mock from "jest-mock-extended";

const makeFakeApplication = () => {
  const config = records.validConfig;
  const mockUserInfoClient = makeMockUserInfoClient();
  const log = logger.makeLogger(config.logger);
  // return an application with all mocked services
  return f.tuple(
    mockUserInfoClient,
    application.makeApplication(config, mockUserInfoClient, log)
  );
};

const makeMockUserInfoClient = () => {
  return mock.mock<userinfo.UserInfoClient>();
}

export { makeFakeApplication, makeMockUserInfoClient };
