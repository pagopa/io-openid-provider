import * as E from "fp-ts/Either";
import * as s from "../interactionService";
import { interaction } from "../../../domain/interactions/__tests__/data";
import { aCosmosResourceMetadata } from "./data";

describe("fromRecord", () => {
  it.skip("should parse the entity without errors", () => {
    const record = s.toRecord(interaction);
    const actual = s.fromRecord({
      ...record,
      ...aCosmosResourceMetadata,
      params: record.params,
      payload: record.payload,
      expireAt: interaction.expireAt,
      issuedAt: interaction.issuedAt,
      identityId: record.identityId || undefined,
      grantId: record.grantId || undefined,
      error: record.error || undefined,
    });
    expect(actual).toStrictEqual(E.right(interaction));
  });
});
