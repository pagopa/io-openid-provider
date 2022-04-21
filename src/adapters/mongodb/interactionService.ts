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
  cookieId: entity.session?.cookieId || null,
  expireAt: entity.expireAt,
  id: entity.id,
  identityId: entity.session?.identityId || null,
  issuedAt: entity.issuedAt,
  params: entity.params,
  payload: entity.payload,
  result: entity.result || null,
  returnTo: entity.returnTo,
});

const fromRecord = (record: prisma.Interaction): t.Validation<Interaction> =>
  Interaction.decode({
    ...record,
    result: record.result || undefined,
    session:
      record.identityId && record.cookieId
        ? { cookieId: record.cookieId, identityId: record.identityId }
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
