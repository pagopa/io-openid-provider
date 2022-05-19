import * as E from "fp-ts/Either";
import * as s from "../clientService";
import { client } from "../../../domain/clients/__tests__/data";

describe("fromRecord", () => {
  it("should parse the entity without errors", () => {
    const actual = s.fromRecord({
      ...s.toRecord(client),
      issuedAt: client.issuedAt,
    });
    expect(actual).toStrictEqual(
      E.right({
        ...client,
        ...client.clientId,
        skipConsent: false,
      })
    );
  });
});
