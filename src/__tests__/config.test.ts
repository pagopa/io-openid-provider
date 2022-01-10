import * as C from "../config";
import * as E from "fp-ts/Either";
import * as DE from "io-ts/DecodeError";
import * as FS from "io-ts/FreeSemigroup";
import * as records from "./utils/records";

describe("Config", () => {
  // TODO integrate with property base test
  describe("given an invalid configuration", () => {
    it("should fail because hostname is missing", () => {
      const confEnv = {
        ...records.validEnv,
        LOG_LEVEL: undefined,
        SERVER_HOSTNAME: undefined,
      };

      const validLogLevel = `"error" | "warn" | "info" | "http" | "verbose" | "debug" | "silly"`;

      const expected = E.left(
        FS.concat(
          FS.of(
            DE.key(
              "LOG_LEVEL",
              DE.required,
              FS.of(DE.leaf(undefined, validLogLevel))
            )
          ),
          FS.of(
            DE.key(
              "SERVER_HOSTNAME",
              DE.required,
              FS.of(DE.leaf(undefined, "string"))
            )
          )
        )
      );
      const actual = C.parseConfig(confEnv);
      expect(actual).toStrictEqual(expected);
    });
  });

  describe("given a valid configuration", () => {
    it("should return a configuration", () => {
      const [validEnv, validConfig] = records.validEnvAndConfig();

      const expected = E.right(validConfig);
      const actual = C.parseConfig(validEnv);
      expect(actual).toStrictEqual(expected);
    });
  });
});
