import * as E from "fp-ts/Either";
import * as s from "../grantService";
import { grant } from "../../../domain/grants/__tests__/data";
import { aCosmosResourceMetadata } from "./data";

describe("fromRecord", () => {
  it("should parse the entity without errors", () => {
    const actual = s.fromRecord({
      ...s.toRecord(grant),
      ...aCosmosResourceMetadata,
      expireAt: grant.expireAt,
      issuedAt: grant.issuedAt,
    });
    expect(actual).toStrictEqual(E.right(grant));
  });
});
