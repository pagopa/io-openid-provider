import * as t from "io-ts";
import { constVoid, pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as prisma from "@prisma/client";
import { PrismaClient } from "@prisma/client";
import { Grant, GrantId } from "../../domain/grants/types";
import { GrantService } from "../../domain/grants/GrantService";
import { Logger } from "../../domain/logger";
import { IdentityId } from "../../domain/identities/types";
import { ClientId } from "../../domain/clients/types";
import { MongoDBConfig } from "./types";
import { runAsTE, runAsTEO } from "./utils";

const toRecord = (entity: Grant): prisma.Prisma.GrantCreateInput => ({
  clientId: entity.subjects.clientId,
  expireAt: entity.expireAt,
  id: entity.id,
  identityId: entity.subjects.identityId,
  issuedAt: entity.issuedAt,
  remember: entity.remember || false,
  scope: entity.scope,
});

const fromRecord = (record: prisma.Grant): t.Validation<Grant> =>
  pipe(
    E.of(
      (grantId: GrantId) => (identityId: IdentityId) => (clientId: ClientId) => ({
        expireAt: record.expireAt,
        id: grantId,
        issuedAt: record.issuedAt,
        remember: record.remember,
        scope: record.scope || undefined,
        subjects: {
          clientId,
          identityId,
        },
      })
    ),
    E.ap(GrantId.decode(record.id)),
    E.ap(IdentityId.decode(record.identityId)),
    E.ap(ClientId.decode(record.clientId))
  );

export const makeGrantService = (
  config: MongoDBConfig,
  logger: Logger,
  client: PrismaClient = new PrismaClient({
    datasources: { db: { url: config.connectionString.href } },
  })
): GrantService => ({
  find: (id) =>
    runAsTEO(logger)("find", fromRecord, () =>
      client.grant.findUnique({ where: { id } })
    ),
  findBy: (selector) =>
    runAsTE(logger)("findBy", E.traverseArray(fromRecord), () =>
      client.grant.findMany({
        where: {
          AND: [
            { identityId: selector.identityId },
            { remember: selector.remember },
            { clientId: O.toUndefined(selector.clientId) },
          ],
        },
      })
    ),
  remove: (id) =>
    runAsTE(logger)(
      "remove",
      (_) => E.right(constVoid()),
      () => client.grant.delete({ where: { id } })
    ),
  upsert: (definition) => {
    const obj = { ...toRecord(definition) };
    return runAsTE(logger)("upsert", fromRecord, () =>
      client.grant.upsert({
        create: obj,
        update: { ...{ ...obj, id: undefined } },
        where: { id: definition.id },
      })
    );
  },
});
