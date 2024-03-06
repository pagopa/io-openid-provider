import { describe, it, expect } from "vitest";

import { makeRegistrationAccessTokenAdapter } from "../registrationAccessTokenAdapter";
import { notImplementedError } from "../../utils";
import { constVoid } from "fp-ts/lib/function";
import { makeLogger } from "../../../../../winston";

const mocks = {
  logger: makeLogger({
    logLevel: "info",
    logName: "registrationAccessTokenAdapter.test",
  }),
};

describe("makeRegistrationAccessTokenAdapter", () => {
  it("should not override useless functions", async () => {
    const id = "identifier";

    const adapter = makeRegistrationAccessTokenAdapter(mocks.logger);

    await expect(adapter.consume(id)).rejects.toThrowError(notImplementedError);
    await expect(adapter.findByUid(id)).rejects.toThrowError(
      notImplementedError
    );
    await expect(adapter.findByUserCode(id)).rejects.toThrowError(
      notImplementedError
    );
    await expect(adapter.revokeByGrantId(id)).rejects.toThrowError(
      notImplementedError
    );
  });
  describe("destroy", () => {
    it("should return always void", async () => {
      const adapter = makeRegistrationAccessTokenAdapter(mocks.logger);
      await expect(adapter.destroy("id")).resolves.toStrictEqual(constVoid());
    });
  });
  describe("upsert", () => {
    it("should return always void", async () => {
      const adapter = makeRegistrationAccessTokenAdapter(mocks.logger);
      await expect(adapter.upsert("id", {}, 123)).resolves.toStrictEqual(
        constVoid()
      );
    });
  });
  describe("find", () => {
    it("should return always a valid token", async () => {
      const id = "identifier";
      const constantDate = new Date();
      const adapter = makeRegistrationAccessTokenAdapter(
        mocks.logger,
        "",
        () => constantDate
      );

      const expected = {
        clientId: id,
        iat: new Date(constantDate.getDate() + 1).getTime(),
        jti: id,
      };

      await expect(adapter.find(id)).resolves.toStrictEqual(expected);
    });
  });
});
