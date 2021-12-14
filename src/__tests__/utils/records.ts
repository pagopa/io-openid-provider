import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as config from "../../config";

const validConfig: config.Config = {
  info: {
    name: "module-name" as NonEmptyString,
    version: "0.0.0.0" as NonEmptyString,
  },
  server: {
    hostname: "0.0.0.0",
    port: 3000,
  },
  logger: {
    logLevel: "debug",
    logName: "io-openid-provider",
  },
};

export { validConfig };
