import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { Config } from "../config";

export const envs = process.env;

export const config: Config = {
  IOClient: {
    baseURL: new URL(envs["IO_BACKEND_BASE_URL"] as string),
  },
  mongodb: {
    connectionString: new URL(envs["MONGODB_URL"] as string),
  },
  info: {
    name: envs["APPLICATION_NAME"] as NonEmptyString,
    version: envs["VERSION"] as NonEmptyString,
  },
  logger: {
    logLevel: envs["LOG_LEVEL"] as any,
    logName: envs["APPLICATION_NAME"] as string,
  },
  server: {
    authenticationCookieKey: envs["AUTHENTICATION_COOKIE_KEY"] as string,
    enableHelmet: false,
    hostname: envs["SERVER_HOSTNAME"] as string,
    port: envs["PORT"] as string,
  },
};
