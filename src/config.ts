import * as t from "io-ts";
import * as PR from "io-ts/PathReporter";
import * as E from "fp-ts/Either";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { UrlFromString } from "@pagopa/ts-commons/lib/url";
import { pipe } from "fp-ts/lib/function";
import * as packageJson from "../package.json";
import * as redis from "./oidcprovider/dal/redis";
import * as logger from "./logger";

interface ServerConfig {
  readonly hostname: string;
  readonly port: string;
}

interface IOBackend {
  readonly baseURL: URL;
}

interface Info {
  readonly name: NonEmptyString;
  readonly version: NonEmptyString;
}

interface Config {
  readonly info: Info;
  readonly IOBackend: IOBackend;
  readonly server: ServerConfig;
  readonly logger: logger.LogConfig;
  readonly redis: redis.RedisConfig;
}

type ConfEnv = NodeJS.ProcessEnv;

const envDecoder = t.type({
  APPLICATION_NAME: t.string,
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
  REDIS_KEY_PREFIX: t.string,
  REDIS_URL: UrlFromString,
  SERVER_HOSTNAME: t.string,
});
type EnvStruct = t.TypeOf<typeof envDecoder>;

const makeConfigFromStr = (str: EnvStruct): Config => ({
  // TODO: Improve the fetch of info
  IOBackend: {
    baseURL: new URL(str.IO_BACKEND_BASE_URL.href),
  },
  info: {
    name: packageJson.name as NonEmptyString,
    version: packageJson.version as NonEmptyString,
  },
  logger: {
    logLevel: str.LOG_LEVEL,
    logName: str.APPLICATION_NAME,
  },
  redis: {
    keyPrefix: str.REDIS_KEY_PREFIX,
    url: new URL(str.REDIS_URL.href),
  },
  server: {
    hostname: str.SERVER_HOSTNAME,
    port: str.PORT,
  },
});

const parseConfig = (processEnv: ConfEnv): E.Either<string, Config> =>
  pipe(
    envDecoder.decode({ ...processEnv }),
    E.bimap(
      (errors) => PR.failure(errors).join("\n"),
      (parsedEnvs) => makeConfigFromStr(parsedEnvs)
    )
  );

export { Config, parseConfig };
