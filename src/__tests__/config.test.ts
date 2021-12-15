import * as C from "../config";
import * as E from "fp-ts/Either";
import * as DE from "io-ts/DecodeError";
import * as FS from "io-ts/FreeSemigroup";
import * as packageJson from "../../package.json";

describe("Config", () => {
  // TODO integrate with property base test
  describe("given an invalid configuration", () => {
    it("should fail because hostname is missing", () => {
      const confEnv = {
        APPLICATION_NAME: "application.test",
        SERVER_PORT: "n",
      };

      const validLogLevel = `"error" | "warn" | "info" | "http" | "verbose" | "debug" | "silly"`;

      const expected = E.left(
        FS.concat(
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
          ),
          FS.of(
            DE.key(
              "SERVER_PORT",
              DE.required,
              FS.of(DE.leaf(NaN, "Not a number"))
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
      const confEnv = {
        SERVER_HOSTNAME: "hostname",
        SERVER_PORT: "1234",
        LOG_LEVEL: "info",
        APPLICATION_NAME: "application",
      };

      const expected = E.right({
        info: { name: packageJson.name, version: packageJson.version },
        logger: { logLevel: "info", logName: "application" },
        server: { hostname: "hostname", port: 1234 },
      });
      const actual = C.parseConfig(confEnv);
      expect(actual).toStrictEqual(expected);
    });
  });
});
