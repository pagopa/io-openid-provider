import * as t from "io-ts";
import { constVoid } from "fp-ts/function";
import * as E from "fp-ts/Either";
import * as prisma from "@prisma/client";
import { PrismaClient } from "@prisma/client";
import { Interaction } from "../../domain/interactions/types";
import { InteractionService } from "../../domain/interactions/InteractionService";
import { Logger } from "../../domain/logger";
import { MongoDBConfig } from "./types";
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

export const makeInteractionService = (
  config: MongoDBConfig,
  logger: Logger,
  client: PrismaClient = new PrismaClient({
    datasources: { db: { url: config.connectionString.href } },
  })
): InteractionService => ({
  find: (id) =>
    runAsTEO(logger)("find", fromRecord, () =>
      client.interaction.findUnique({ where: { id } })
    ),
  remove: (id) =>
    runAsTE(logger)(
      "remove",
      (_) => E.right(constVoid()),
      () => client.interaction.delete({ where: { id } })
    ),
  upsert: (definition) => {
    const obj = { ...toRecord(definition) };
    return runAsTE(logger)("upsert", fromRecord, () =>
      client.interaction.upsert({
        create: obj,
        update: { ...{ ...obj, id: undefined } },
        where: { id: definition.id },
      })
    );
  },
});
