import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { Config } from "../config";
import { Seconds } from "../domain/types/index.js";
import * as jose2 from "jose2";
import { LogLevel } from "../adapters/winston/index.js";

const jwk = jose2.JWK.generateSync("EC", "P-256", { use: "sig" }).toJWK(true);

export const envs: NodeJS.ProcessEnv = {
  IO_BACKEND_BASE_URL: "https://app-backend.io.italia.it",
  COSMOSDB_NAME: "fims",
  COSMOSDB_CONNECTION_STRING:
    "AccountEndpoint=https://unit-test-account.documents.azure.com:443/;AccountKey=key;",
  ENABLE_FEATURE_REMEMBER_GRANT: "true",
  APPLICATION_NAME: "io-openid-provider.test",
  VERSION: "0.0.0",
  ISSUER: "http://localhost:3001",
  LOG_LEVEL: "debug",
  AUTHENTICATION_COOKIE_KEY: "X-IO-Federation-Token",
  EXPRESS_SERVER_HOSTNAME: "localhost",
  GRANT_TTL_IN_SECONDS: "86400",
  PORT: "3001",
  COOKIES_KEY: "just-for-testing-purposes",
  JWK_PRIMARY: JSON.stringify(jwk),
  JWK_SECONDARY: undefined,
};

export const config: Config = {
  IOClient: {
    baseURL: new URL(envs["IO_BACKEND_BASE_URL"] as string),
  },
  cosmosdb: {
    cosmosDbName: envs["COSMOSDB_NAME"],
    connectionString: envs["COSMOSDB_CONNECTION_STRING"],
  },
  features: {
    grant: {
      enableRememberGrantFeature:
        envs["ENABLE_FEATURE_REMEMBER_GRANT"] === "true",
      grantTTL: parseInt(envs["GRANT_TTL_IN_SECONDS"]) as Seconds,
    },
  },
  info: {
    name: envs["APPLICATION_NAME"] as NonEmptyString,
    version: envs["VERSION"] as NonEmptyString,
  },
  issuer: new URL(envs["ISSUER"] as string),
  logger: {
    logLevel: envs["LOG_LEVEL"] as LogLevel,
    logName: envs["APPLICATION_NAME"] as string,
  },
  server: {
    authenticationCookieKey: envs["AUTHENTICATION_COOKIE_KEY"] as string,
    enableHelmet: false,
    enableProxy: false,
    hostname: envs["EXPRESS_SERVER_HOSTNAME"] as string,
    port: envs["PORT"] as string,
    cookiesKey: envs["COOKIES_KEY"] as string,
    jwkPrimary: envs["JWK_PRIMARY"] as string,
    jwkSecondary: envs["JWK_SECONDARY"] as string,
  },
};
