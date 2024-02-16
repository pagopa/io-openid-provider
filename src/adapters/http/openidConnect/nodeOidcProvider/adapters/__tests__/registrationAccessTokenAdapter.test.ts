import { makeRegistrationAccessTokenAdapter } from "../registrationAccessTokenAdapter";
import { notImplementedError } from "../../utils";
import { constVoid } from "fp-ts/lib/function";
import { describe, it, expect, vi } from "vitest";
import { loggerMock } from "../../../../../../__mock__/logger";

describe("makeRegistrationAccessTokenAdapter", () => {
  it("should not override useless functions", async () => {
    const id = "identifier";
    const adapter = makeRegistrationAccessTokenAdapter(loggerMock);

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
      const adapter = makeRegistrationAccessTokenAdapter(loggerMock);

      await expect(adapter.destroy("id")).resolves.toStrictEqual(constVoid());
    });
  });
  describe("upsert", () => {
    it("should return always void", async () => {
      const adapter = makeRegistrationAccessTokenAdapter(loggerMock);

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
        loggerMock,
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
