import * as t from "io-ts";
import * as tt from "io-ts-types";
import * as PR from "io-ts/PathReporter";
import * as E from "fp-ts/Either";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { UrlFromString } from "@pagopa/ts-commons/lib/url";
import { pipe } from "fp-ts/lib/function";
import { LogConfig } from "./adapters/winston";
import { MongoDBConfig } from "./adapters/mongodb";
import { IOClientConfig } from "./adapters/ioBackend";
import { Seconds } from "./domain/types";
import { Features } from "./useCases";

interface ServerConfig {
  readonly hostname: string;
  readonly port: string;
  readonly enableProxy: boolean;
  readonly enableHelmet: boolean;
  readonly authenticationCookieKey: string;
  readonly jwkPrimary: string;
  readonly jwkSecondary: undefined | string;
  readonly cookiesKey: string;
}

interface Info {
  readonly name: NonEmptyString;
  readonly version: NonEmptyString;
}

type Envs = NodeJS.ProcessEnv;

const EnvType = t.type({
  APPLICATION_NAME: NonEmptyString,
  AUTHENTICATION_COOKIE_KEY: NonEmptyString,
  COOKIES_KEY: t.string,
  ENABLE_PROXY: tt.fromNullable(tt.BooleanFromString, false),
  FEATURE_REMEMBER_GRANT: t.union([
    t.literal("enabled"),
    t.literal("disabled"),
  ]),
  GRANT_TTL_IN_SECONDS: tt.IntFromString,
  IO_BACKEND_BASE_URL: UrlFromString,
  ISSUER: UrlFromString,
  // TODO: Make better typing
  JWK_PRIMARY: NonEmptyString,
  JWK_SECONDARY: t.union([t.undefined, NonEmptyString]),
  LOG_LEVEL: t.keyof({
    debug: null,
    error: null,
    http: null,
    info: null,
    silly: null,
    verbose: null,
    warn: null,
  }),
  MONGODB_URL: UrlFromString,
  PORT: t.string,
  SERVER_HOSTNAME: t.string,
  VERSION: NonEmptyString,
});
type EnvType = t.TypeOf<typeof EnvType>;

const makeConfig = (envs: EnvType): Config => ({
  IOClient: {
    baseURL: new URL(envs.IO_BACKEND_BASE_URL.href),
  },
  features: {
    grant: {
      grantTTL: envs.GRANT_TTL_IN_SECONDS.valueOf() as Seconds,
      rememberGrantFeature: envs.FEATURE_REMEMBER_GRANT,
    },
  },
  info: {
    name: envs.APPLICATION_NAME,
    version: envs.VERSION,
  },
  issuer: new URL(envs.ISSUER.href),
  logger: {
    logLevel: envs.LOG_LEVEL,
    logName: envs.APPLICATION_NAME,
  },
  mongodb: {
    connectionString: new URL(envs.MONGODB_URL.href),
  },
  server: {
    authenticationCookieKey: envs.AUTHENTICATION_COOKIE_KEY,
    cookiesKey: envs.COOKIES_KEY,
    enableHelmet: false,
    enableProxy: envs.ENABLE_PROXY,
    hostname: envs.SERVER_HOSTNAME,
    jwkPrimary: envs.JWK_PRIMARY,
    jwkSecondary: envs.JWK_SECONDARY,
    port: envs.PORT,
  },
});

/**
 * Represent the configurations of the application
 */
export interface Config {
  readonly features: Features;
  readonly info: Info;
  readonly IOClient: IOClientConfig;
  readonly logger: LogConfig;
  readonly server: ServerConfig;
  readonly mongodb: MongoDBConfig;
  readonly issuer: URL;
}

/**
 * Given a dictionary of strings return the configuration or a
 * string containing a human readable error
 */
export const parseConfig = (envs: Envs): E.Either<string, Config> =>
  pipe(
    EnvType.decode(envs),
    E.bimap(
      (errors) => PR.failure(errors).join("\n"),
      (parsedEnvs) => makeConfig(parsedEnvs)
    )
  );
