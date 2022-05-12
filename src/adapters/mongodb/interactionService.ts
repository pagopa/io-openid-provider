import * as t from "io-ts";
import { constVoid } from "fp-ts/function";
import * as E from "fp-ts/Either";
import * as prisma from "@prisma/client";
import { Prisma } from "@prisma/client";
import { Interaction } from "../../domain/interactions/types";
import { InteractionService } from "../../domain/interactions/InteractionService";
import { Logger } from "../../domain/logger";
import { runAsTE, runAsTEO } from "./utils";

const toRecord = (
  entity: Interaction
): prisma.Prisma.InteractionCreateInput => ({
  error: entity.result && "error" in entity.result ? entity.result.error : null,
  expireAt: entity.expireAt,
  grantId:
    entity.result && "grantId" in entity.result ? entity.result.grantId : null,
  id: entity.id,
  identityId:
    entity.result && "identityId" in entity.result
      ? entity.result.identityId
      : null,
  issuedAt: entity.issuedAt,
  params: Interaction.props.params.encode(entity.params),
  payload: entity.payload,
});

const fromRecord = (record: prisma.Interaction): t.Validation<Interaction> =>
  Interaction.decode({
    ...record,
    result:
      record.error || record.grantId || record.identityId
        ? {
            error: record.error || undefined,
            grantId: record.grantId || undefined,
            identityId: record.identityId || undefined,
          }
        : undefined,
  });

export const makeInteractionService = <T>(
  logger: Logger,
  client: Prisma.InteractionDelegate<T>
): InteractionService => ({
  find: (id) =>
    runAsTEO(logger)("find", fromRecord, () =>
      client.findUnique({ where: { id } })
    ),
  remove: (id) =>
    runAsTE(logger)(
      "remove",
      (_) => E.right(constVoid()),
      () => client.delete({ where: { id } })
    ),
  upsert: (definition) => {
    const obj = { ...toRecord(definition) };
    return runAsTE(logger)("upsert", fromRecord, () =>
      client.upsert({
        create: obj,
        update: { ...{ ...obj, id: undefined } },
        where: { id: definition.id },
      })
    );
  },
});
