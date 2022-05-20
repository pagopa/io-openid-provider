import * as E from "fp-ts/Either";
import * as s from "../interactionService";
import { interaction } from "../../../domain/interactions/__tests__/data";
import { Prisma } from "@prisma/client";

describe("fromRecord", () => {
  it("should parse the entity without errors", () => {
    const record = s.toRecord(interaction);
    const actual = s.fromRecord({
      ...record,
      params: record.params as Prisma.JsonValue,
      payload: record.payload as Prisma.JsonValue,
      expireAt: interaction.expireAt,
      issuedAt: interaction.issuedAt,
      identityId: record.identityId || null,
      grantId: record.grantId || null,
      error: record.error || null,
    });
    expect(actual).toStrictEqual(E.right(interaction));
  });
});
