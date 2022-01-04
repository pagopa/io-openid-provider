import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as config from "../../config";
import * as oidc from "oidc-provider";
import { tuple } from "fp-ts/lib/function";
import * as packageJson from "../../../package.json";

const validConfig: config.Config = {
  info: {
    name: packageJson.name as NonEmptyString,
    version: packageJson.version as NonEmptyString,
  },
  server: {
    hostname: "0.0.0.0",
    port: "3000",
  },
  logger: {
    logLevel: "debug",
    logName: "application",
  },
  redis: {
    url: new URL("http://localhost:3791"),
    keyPrefix: "oidc:"
  }
};

const validEnv = {
  SERVER_HOSTNAME: "0.0.0.0",
  SERVER_PORT: "3000",
  LOG_LEVEL: "debug",
  APPLICATION_NAME: "application",
  REDIS_URL: "http://localhost:3791",
  REDIS_KEY_PREFIX: "oidc:",
};
const validEnvAndConfig = () => {

  return tuple(validEnv, validConfig)
}

const loginPromptDetail: oidc.PromptDetail = {
  name: "login",
  reasons: [],
  details: {}
};
const consentPromptDetail: oidc.PromptDetail = {
  name: "consent",
  reasons: [],
  details: {}
};

export { validEnvAndConfig, validEnv, validConfig, loginPromptDetail, consentPromptDetail };
