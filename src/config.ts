import * as t from "io-ts";
import * as PR from "io-ts/PathReporter";
import * as E from "fp-ts/Either";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { UrlFromString } from "@pagopa/ts-commons/lib/url";
import { pipe } from "fp-ts/lib/function";
import { LogConfig } from "./adapters/winston";

interface ServerConfig {
  readonly hostname: string;
  readonly port: string;
  readonly enableHelmet: boolean;
  readonly authenticationCookieKey: string;
}

interface IOBackend {
  readonly baseURL: URL;
}

interface Info {
  readonly name: NonEmptyString;
  readonly version: NonEmptyString;
}

type Envs = NodeJS.ProcessEnv;

const EnvType = t.type({
  APPLICATION_NAME: NonEmptyString,
  AUTHENTICATION_COOKIE_KEY: NonEmptyString,
  IO_BACKEND_BASE_URL: UrlFromString,
  LOG_LEVEL: t.keyof({
    debug: null,
    error: null,
    http: null,
    info: null,
    silly: null,
    verbose: null,
    warn: null,
  }),
  PORT: t.string,
  POSTGRES_URL: UrlFromString,
  SERVER_HOSTNAME: t.string,
  VERSION: NonEmptyString,
});
type EnvType = t.TypeOf<typeof EnvType>;

const makeConfig = (envs: EnvType): Config => ({
  IOBackend: {
    baseURL: new URL(envs.IO_BACKEND_BASE_URL.href),
  },
  info: {
    name: envs.APPLICATION_NAME,
    version: envs.VERSION,
  },
  logger: {
    logLevel: envs.LOG_LEVEL,
    logName: envs.APPLICATION_NAME,
  },
  server: {
    authenticationCookieKey: envs.AUTHENTICATION_COOKIE_KEY,
    enableHelmet: false,
    hostname: envs.SERVER_HOSTNAME,
    port: envs.PORT,
  },
});

/**
 * Represent the configurations of the application
 */
export interface Config {
  readonly info: Info;
  readonly IOBackend: IOBackend;
  readonly logger: LogConfig;
  readonly server: ServerConfig;
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
