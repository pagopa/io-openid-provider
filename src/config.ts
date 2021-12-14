import * as e from "fp-ts/Either";
import { pipe } from "fp-ts/function";
import * as d from "io-ts/Decoder";
// TODO: Remove this dependency
import { LogConfig } from "@pagopa/cloudgaap-commons-ts/lib/logger";

interface ServerConfig {
  readonly hostname: string;
  readonly port: number;
}

interface Config {
  readonly server: ServerConfig;
  readonly logger: LogConfig;
}

type ConfEnv = NodeJS.ProcessEnv;

// Decode an integer from a string
const intFromStringDecoder: d.Decoder<string, number> = {
  decode: (s) =>
    pipe(Number.parseInt(s, 10), (n) =>
      Number.isNaN(n) ? d.failure(n, "Not a number") : d.success(n)
    ),
};

// Decode an integer from an unknown value
const intFromUnknownDecoder = d.compose(intFromStringDecoder)(d.string);

const envDecoder = d.struct({
  APPLICATION_NAME: d.string,
  LOG_LEVEL: d.literal("debug", "trace", "error", "info", "fatal", "warn"),
  SERVER_HOSTNAME: d.string,
  SERVER_PORT: intFromUnknownDecoder,
});
type EnvStruct = d.TypeOf<typeof envDecoder>;

const makeConfigFromStr = (str: EnvStruct): Config => ({
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
  const result = envDecoder.decode(processEnv);
  return e.map(makeConfigFromStr)(result);
};

export { Config, parseConfig };
