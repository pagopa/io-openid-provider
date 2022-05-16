import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { Config } from "../config";
import { Seconds } from "../domain/types";
import { generateKeyPairSync } from "crypto";
import { pem2jwk } from "pem-jwk";

// Generate a private key just for testing purposes
const { privateKey } = generateKeyPairSync("rsa", {
  modulusLength: 4096,
  publicKeyEncoding: {
    type: "spki",
    format: "pem",
  },
  privateKeyEncoding: {
    type: "pkcs1",
    format: "pem",
  },
});

const privateJwk = pem2jwk(privateKey);

export const envs: NodeJS.ProcessEnv = {
  ...process.env,
  JWK_PRIMARY: JSON.stringify(privateJwk),
  JWK_SECONDARY: JSON.stringify(privateJwk),
};

export const config: Config = {
  IOClient: {
    baseURL: new URL(envs["IO_BACKEND_BASE_URL"] as string),
  },
  grantTTL: 86400 as Seconds,
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
    hostname: envs["SERVER_HOSTNAME"] as string,
    port: envs["PORT"] as string,
    cookiesKey: envs["COOKIES_KEY"] as string,
    jwkPrimary: envs["JWK_PRIMARY"] as string,
    jwkSecondary: envs["JWK_SECONDARY"] as string,
  },
};
