import * as E from "fp-ts/Either";
import * as s from "../sessionService";
import { session } from "../../../domain/sessions/__tests__/data";
import { aCosmosResourceMetadata } from "./data";
import { describe, it, expect } from "vitest";

describe("fromRecord", () => {
  it("should parse the entity without errors", () => {
    const record = s.toRecord(session);
    const actual = s.fromRecord({
      ...record,
      ...aCosmosResourceMetadata,
    });
    expect(actual).toStrictEqual(E.right(session));
  });
});
