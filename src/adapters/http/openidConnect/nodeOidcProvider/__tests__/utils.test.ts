import * as fc from "fast-check";
import * as E from "fp-ts/Either";
import { identity } from "../../../../../domain/identities/__tests__/data";
import { grant } from "../../../../../domain/grants/__tests__/data";
import {
  DateFromNumericDate,
  makeNotImplementedAdapter,
  notImplementedError,
  IdentityIdAndGrantId,
} from "../utils";
import { describe, it, expect } from "vitest";
import { loggerMock } from "../../../../../__mock__/logger";

describe("makeNotImplementedAdapter", () => {
  it("should implements all functions", async () => {
    const id = "id";
    const adapter = makeNotImplementedAdapter("Test", loggerMock);

    await expect(adapter.consume(id)).rejects.toThrowError(notImplementedError);
    await expect(adapter.destroy(id)).rejects.toThrowError(notImplementedError);
    await expect(adapter.find(id)).rejects.toThrowError(notImplementedError);
    await expect(adapter.findByUid(id)).rejects.toThrowError(
      notImplementedError
    );
    await expect(adapter.findByUserCode(id)).rejects.toThrowError(
      notImplementedError
    );
    await expect(adapter.revokeByGrantId(id)).rejects.toThrowError(
      notImplementedError
    );
    await expect(adapter.upsert(id, {}, 123)).rejects.toThrowError(
      notImplementedError
    );
  });
});

describe("IdentityIdAndGrantId", () => {
  const Type = IdentityIdAndGrantId;
  const identityId = identity.id;
  const grantId = grant.id;
  describe("encode", () => {
    it("should encode without error", () => {
      expect(Type.encode([identityId, grantId])).toStrictEqual(
        `${identityId}:${grantId}`
      );
    });
  });
  describe("decode", () => {
    it("should return right given a valid value", () => {
      const valid = `${identityId}:${grantId}`;
      expect(Type.decode(valid)).toStrictEqual(E.right([identityId, grantId]));
    });
    it("should return left given an invalid value", () => {
      const inputGen = fc.oneof(
        fc.string(),
        fc.string().map((s) => fc.constantFrom(`${s}:`, `:${s}`))
      );
      fc.assert(
        fc.property(inputGen, (input) => {
          expect(E.isLeft(Type.decode(input))).toStrictEqual(true);
        })
      );
    });
  });
});

describe("DateFromNumericDate", () => {
  it("should work as expected", () => {
    fc.assert(
      fc.property(fc.date(), (date) => {
        date.setMilliseconds(0);
        const numericDate = date.getTime() / 1000;

        const decoded = DateFromNumericDate.decode(numericDate);
        const expectedDecoded = E.right(date);
        expect(decoded).toStrictEqual(expectedDecoded);

        const encoded = DateFromNumericDate.encode(date);
        const expectedEncoded = numericDate;
        expect(encoded).toStrictEqual(expectedEncoded);
      })
    );
  });
});
