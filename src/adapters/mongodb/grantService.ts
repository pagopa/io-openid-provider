import * as t from "io-ts";
import { constVoid, pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as prisma from "@prisma/client";
import { Prisma } from "@prisma/client";
import { Grant, GrantId } from "../../domain/grants/types";
import { GrantService } from "../../domain/grants/GrantService";
import { Logger } from "../../domain/logger";
import { IdentityId } from "../../domain/identities/types";
import { ClientId } from "../../domain/clients/types";
import { runAsTE, runAsTEO } from "./utils";

const toRecord = (entity: Grant): prisma.Prisma.GrantCreateInput => ({
  clientId: Grant.props.subjects.props.clientId.encode(
    entity.subjects.clientId
  ),
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
    E.ap(Grant.props.subjects.props.clientId.decode(record.clientId))
  );

export const makeGrantService = <T>(
  logger: Logger,
  client: Prisma.GrantDelegate<T>
): GrantService => ({
  find: (id) =>
    runAsTEO(logger)("find", fromRecord, () =>
      client.findUnique({ where: { id } })
    ),
  findBy: (selector) =>
    runAsTE(logger)("findBy", E.traverseArray(fromRecord), () =>
      client.findMany({
        where: {
          AND: [
            { identityId: selector.identityId },
            { remember: selector.remember },
            {
              clientId: pipe(
                selector.clientId,
                O.map(Grant.props.subjects.props.clientId.encode),
                O.toUndefined
              ),
            },
          ],
        },
      })
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
