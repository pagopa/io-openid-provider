import { describe, it, expect } from "vitest";

import * as E from "fp-ts/lib/Either.js";
import * as s from "../sessionService";
import { session } from "../../../domain/sessions/__tests__/data";
import { aCosmosResourceMetadata } from "./data";

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
