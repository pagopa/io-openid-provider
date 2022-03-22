import { FiscalCode, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as config from "../../config";
import { UserIdentity } from "../../generated/clients/io-auth/UserIdentity";
import { Identity } from "../../identities/domain";

const validConfig: config.Config = {
  IOBackend: {
    baseURL: new URL("https://iobackend.it"),
  },
  info: {
    name: "application-name" as NonEmptyString,
    version: "v0.0.0" as NonEmptyString,
  },
  server: {
    hostname: "0.0.0.0",
    port: "3000",
  },
  logger: {
    logLevel: "debug",
    logName: "application-name",
  },
  postgres: {
    url: new URL("postgresql://user:randompassword@localhost:5432/db"),
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
  APPLICATION_NAME: validConfig.info.name,
  POSTGRES_URL: "postgresql://user:randompassword@localhost:5432/db",
  REDIS_URL: "http://localhost:3791",
  REDIS_KEY_PREFIX: "oidc:",
  VERSION: validConfig.info.version,
};

const loginInteraction = {
  iat: 1645801391,
  exp: 1645801691,
  returnTo: "http://localhost:3001/oauth/authorize/Uj7G5GeSX9vkiXM8kQw0o",
  prompt: {
    name: "login",
    reasons: ["no_session"],
    details: {},
  },
  params: {
    client_id: "6YaAnihF6ILN-nnGWwtwC",
    nonce: "<nonce>",
    redirect_uri: "https://127.0.0.1/callback",
    response_type: "id_token",
    scope: "openid",
    state: "<state>",
  },
  kind: "Interaction",
  jti: "Uj7G5GeSX9vkiXM8kQw0o",
};

const consentInteraction = {
  iat: 1645803833,
  exp: 1645804133,
  returnTo: "http://localhost:3001/oauth/authorize/nt62KyS3J-IkRmhlG_5rB",
  prompt: {
    name: "consent",
    reasons: ["op_scopes_missing"],
    details: {
      missingOIDCScope: ["openid"],
    },
  },
  lastSubmission: {
    login: {
      accountId: "123",
    },
  },
  params: {
    client_id: "6YaAnihF6ILN-nnGWwtwC",
    nonce: "<nonce>",
    redirect_uri: "https://127.0.0.1/callback",
    response_type: "id_token",
    scope: "openid",
    state: "<state>",
  },
  session: {
    accountId: "123",
    cookie: "dcW-CokbngzN18cxaLY1B",
  },
  kind: "Interaction",
  jti: "nt62KyS3J-IkRmhlG_5rB",
  uid: "Rb2bPapkvqoWxlDSvwMuB",
};

const interactions = {
  login: loginInteraction,
  consent: consentInteraction,
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
  interactions,
  validUserIdentity,
  validIdentity,
  fiscalCode,
};
