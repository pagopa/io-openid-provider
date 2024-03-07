import { describe, it, expect } from "vitest";

import * as C from "../config";
import * as E from "fp-ts/lib/Either.js";
import * as f from "fp-ts/lib/function.js";
import * as data from "./data";

describe("Config", () => {
  describe("given an invalid configuration", () => {
    it("should fail because hostname and log level are missing", () => {
      const envs = {
        ...data.envs,
        LOG_LEVEL: undefined,
        EXPRESS_SERVER_HOSTNAME: undefined,
      };

      const actual = C.parseConfig(envs);
      expect(f.pipe(actual, E.isLeft)).toStrictEqual(true);
    });
  });

  describe("given a valid configuration", () => {
    it("should return a configuration", () => {
      const expected = E.right(data.config);
      const actual = C.parseConfig(data.envs);
      expect(actual).toStrictEqual(expected);
    });
  });
});
