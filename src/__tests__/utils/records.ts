import { FiscalCode, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as config from "../../config";
import * as oidc from "oidc-provider";
import * as O from "fp-ts/Option";
import { tuple } from "fp-ts/lib/function";
import * as packageJson from "../../../package.json";
import { UserIdentity } from "../../generated/clients/io-auth/UserIdentity";
import { UserInfo } from "../../userinfo";

const validConfig: config.Config = {
  provider: {
    testClient: O.some({
      clientId: "client-id",
      redirectUris: [new URL("https://relying-party.io/callback")],
    }),
  },
  IOBackend: {
    baseURL: new URL("https://iobackend.it"),
  },
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
    keyPrefix: "oidc:",
  },
};

const validEnv = {
  IO_BACKEND_BASE_URL: "https://iobackend.it",
  TEST_CLIENT_ID: "client-id",
  TEST_CLIENT_REDIRECT_URI: "https://relying-party.io/callback",
  SERVER_HOSTNAME: "0.0.0.0",
  SERVER_PORT: "3000",
  LOG_LEVEL: "debug",
  APPLICATION_NAME: "application",
  REDIS_URL: "http://localhost:3791",
  REDIS_KEY_PREFIX: "oidc:",
};
const validEnvAndConfig = () => {
  return tuple(validEnv, validConfig);
};

const loginPromptDetail: oidc.PromptDetail = {
  name: "login",
  reasons: [],
  details: {},
};
const consentPromptDetail: oidc.PromptDetail = {
  name: "consent",
  reasons: [],
  details: {},
};

const fiscalCode = "TMMEXQ60A10Y526X" as FiscalCode;

const validUserIdentity: UserIdentity = {
  name: "Asdrubale",
  family_name: "Roitek",
  fiscal_code: fiscalCode,
  date_of_birth: new Date(),
};
const validUserInfo: UserInfo = {
  familyName: validUserIdentity.family_name,
  fiscalCode: validUserIdentity.fiscal_code,
  name: validUserIdentity.name,
};

export {
  validEnvAndConfig,
  validEnv,
  validConfig,
  loginPromptDetail,
  consentPromptDetail,
  validUserIdentity,
  validUserInfo,
  fiscalCode,
};
