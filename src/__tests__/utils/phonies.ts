import * as f from "fp-ts/function";
import * as records from "./records";
import * as application from "../../application";
import * as userinfo from "../../userinfo";
import * as logger from "../../logger";
import * as mock from "jest-mock-extended";

const makeFakeApplication = () => {
  const config = records.validConfig;
  const mockUserInfoClient = mock.mock<userinfo.UserInfoClient>();
  const log = logger.makeLogger(config.logger);
  // return an application with all mocked services
  return f.tuple(
    mockUserInfoClient,
    application.makeApplication(config, mockUserInfoClient, log)
  );
};

export { makeFakeApplication };
