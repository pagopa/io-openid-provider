import * as E from "fp-ts/Either";
import * as s from "../clientService";
import { client } from "../../../domain/clients/__tests__/data";
import { aCosmosResourceMetadata } from "./data";

describe("fromRecord", () => {
  it("should parse the entity without errors", () => {
    const actual = s.fromRecord({
      ...s.toRecord(client),
      ...aCosmosResourceMetadata,
      issuedAt: client.issuedAt,
    });
    expect(actual).toStrictEqual(
      E.right({
        ...client,
        ...aCosmosResourceMetadata,
        id: "service-id",
        organizationId: "00000000000",
        skipConsent: false,
      })
    );
  });
});
