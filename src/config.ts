import * as E from "fp-ts/Either";
import * as D from "io-ts/Decoder";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as packageJson from "../package.json";
import * as decoders from "./utils/decoders";
import * as redis from "./oidcprovider/dal/redis";
import * as logger from "./logger";
import * as provider from "./oidcprovider/provider";

interface ServerConfig {
  readonly hostname: string;
  readonly port: string;
}

interface Info {
  readonly name: NonEmptyString;
  readonly version: NonEmptyString;
}

interface Config {
  readonly info: Info;
  readonly provider: provider.ProviderConfig;
  readonly server: ServerConfig;
  readonly logger: logger.LogConfig;
  readonly redis: redis.RedisConfig;
}

type ConfEnv = NodeJS.ProcessEnv;

const envDecoder = D.struct({
  APPLICATION_NAME: D.string,
  LOG_LEVEL: D.literal(
    "error",
    "warn",
    "info",
    "http",
    "verbose",
    "debug",
    "silly"
  ),
  REDIS_KEY_PREFIX: D.string,
  REDIS_URL: D.compose(decoders.UrlFromString)(D.string),
  SERVER_HOSTNAME: D.string,
  SERVER_PORT: D.string,
  TEST_CLIENT_ID: decoders.option(D.string),
});
type EnvStruct = D.TypeOf<typeof envDecoder>;

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
  provider: {
    testClientId: str.TEST_CLIENT_ID,
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

const parseConfig = (processEnv: ConfEnv): E.Either<D.DecodeError, Config> => {
  const result = envDecoder.decode({ ...processEnv });
  return E.map(makeConfigFromStr)(result);
};

export { Config, parseConfig };
