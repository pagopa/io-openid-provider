import * as e from "fp-ts/Either";
import * as d from "io-ts/Decoder";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as packageJson from "../package.json";
import * as decoders from "./utils/decoders";
import * as redis from "./oidcprovider/dal/redis";
import * as logger from "./logger";

interface ServerConfig {
  readonly hostname: string;
  readonly port: string;
}

interface Info {
  readonly name: NonEmptyString;
  readonly version: NonEmptyString;
}

interface Config {
  readonly server: ServerConfig;
  readonly logger: logger.LogConfig;
  readonly info: Info;
  readonly redis: redis.RedisConfig;
}

type ConfEnv = NodeJS.ProcessEnv;

const envDecoder = d.struct({
  APPLICATION_NAME: d.string,
  LOG_LEVEL: d.literal(
    "error",
    "warn",
    "info",
    "http",
    "verbose",
    "debug",
    "silly"
  ),
  REDIS_KEY_PREFIX: d.string,
  REDIS_URL: d.compose(decoders.urlFromStringDecoder)(d.string),
  SERVER_HOSTNAME: d.string,
  SERVER_PORT: d.string,
});
type EnvStruct = d.TypeOf<typeof envDecoder>;

const makeConfigFromStr = (str: EnvStruct): Config => ({
  // TODO: Improve the fetch of info
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
    url: str.REDIS_URL,
  },
  server: {
    hostname: str.SERVER_HOSTNAME,
    port: str.SERVER_PORT,
  },
});

const parseConfig = (processEnv: ConfEnv): e.Either<d.DecodeError, Config> => {
  const result = envDecoder.decode({ ...processEnv });
  return e.map(makeConfigFromStr)(result);
};

export { Config, parseConfig };
