import * as E from "fp-ts/Either";
import * as s from "../clientService";
import { client } from "../../../domain/clients/__tests__/data";
import { CosmosResource } from "@pagopa/io-functions-commons/dist/src/utils/cosmosdb_model";

const aCosmosResourceMetadata: Omit<CosmosResource, "id"> = {
  _etag: "_etag",
  _rid: "_rid",
  _self: "_self",
  _ts: 1
};

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
