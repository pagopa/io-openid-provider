import * as e from "fp-ts/Either";
import * as d from "io-ts/Decoder";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as packageJson from "../package.json";
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
