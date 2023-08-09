import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { Config } from "../config";
import { Seconds } from "../domain/types";
import * as jose2 from "jose2";

const jwk = jose2.JWK.generateSync("EC", "P-256", { use: "sig" }).toJWK(true);

export const envs: NodeJS.ProcessEnv = {
  ...process.env,
  JWK_PRIMARY: JSON.stringify(jwk),
  JWK_SECONDARY: undefined,
};

export const config: Config = {
  IOClient: {
    baseURL: new URL(envs["IO_BACKEND_BASE_URL"] as string),
  },
  cosmosdb: {
    cosmosDbName: envs["COSMOSDB_NAME"] as NonEmptyString,
    cosmosDbUri: envs["COSMOSDB_URI"] as NonEmptyString,
    masterKey: envs["COSMOSDB_KEY"] as NonEmptyString,
  },
  features: {
    grant: {
      enableRememberGrantFeature:
        envs["ENABLE_FEATURE_REMEMBER_GRANT"] === "true",
      grantTTL: 86400 as Seconds,
    },
  },
  mongodb: {
    connectionString: new URL(envs["MONGODB_URL"] as string),
  },
  info: {
    name: envs["APPLICATION_NAME"] as NonEmptyString,
    version: envs["VERSION"] as NonEmptyString,
  },
  issuer: new URL(envs["ISSUER"] as string),
  logger: {
    logLevel: envs["LOG_LEVEL"] as any,
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
