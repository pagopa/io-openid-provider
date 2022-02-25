import { FiscalCode, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as config from "../../config";
import { UserIdentity } from "../../generated/clients/io-auth/UserIdentity";
import { Identity } from "../../identities/domain";
import * as packageJson from "../../../package.json";

const validConfig: config.Config = {
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

const envs = {
  IO_BACKEND_BASE_URL: "https://iobackend.it",
  SERVER_HOSTNAME: "0.0.0.0",
  PORT: "3000",
  LOG_LEVEL: "debug",
  APPLICATION_NAME: "application",
  REDIS_URL: "http://localhost:3791",
  REDIS_KEY_PREFIX: "oidc:",
};

const interaction = {
  consent: {
    params: {},
    session: {
      accountId: "account-id",
    },
    prompt: {
      name: "consent",
      reasons: [],
      details: {},
    },
    uid: "this-is-uid",
  },
};

const fiscalCode = "TMMEXQ60A10Y526X" as FiscalCode;

const validUserIdentity: UserIdentity = {
  name: "Asdrubale",
  family_name: "Roitek",
  fiscal_code: fiscalCode,
  date_of_birth: new Date(),
};
const validIdentity: Identity = {
  familyName: validUserIdentity.family_name,
  fiscalCode: validUserIdentity.fiscal_code,
  givenName: validUserIdentity.name,
};

export {
  envs,
  validConfig,
  interaction,
  validUserIdentity,
  validIdentity,
  fiscalCode,
};
