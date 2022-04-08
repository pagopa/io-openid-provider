import * as prisma from "@prisma/client";
import { Prisma, PrismaClient } from "@prisma/client";
import { flow, pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { Logger } from "../../logger";
import { GrantRepository } from "../../core/repositories/GrantRepository";
import {
  Grant,
  DomainErrorTypes,
  GrantId,
  AccountId,
  ClientId,
} from "../../core/domain";
import { PostgresConfig } from "./domain";

const toRecord = (input: Grant): prisma.Grant => ({
  accountId: input.accountId,
  clientId: input.clientId,
  expireAt: input.expireAt,
  id: input.id,
  issuedAt: input.issuedAt,
  scope: input.scope,
});

// FIXME: The "as *"" casts are not very elegant solution, find a better one
const fromRecord = (record: prisma.Grant): Grant => ({
  accountId: record.accountId as AccountId,
  clientId: record.clientId as ClientId,
  expireAt: record.expireAt,
  id: record.id as GrantId,
  issuedAt: record.issuedAt,
  scope: record.scope,
});

const upsertGrant =
  (logger: Logger) =>
  <T>(client: Prisma.GrantDelegate<T>) =>
  (grant: Grant) =>
    pipe(
      TE.tryCatch(
        () =>
          client.upsert({
            create: toRecord(grant),
            update: toRecord(grant),
            where: { id: grant.id },
          }),
        E.toError
      ),
      TE.orElseFirst((e) =>
        TE.of(logger.error(`Error on upsertGrant ${JSON.stringify(e)}`, e))
      ),
      TE.bimap(
        (e) => ({ causedBy: e, kind: DomainErrorTypes.GENERIC_ERROR }),
        (_) => grant
      )
    );

const findGrant =
  (logger: Logger) =>
  <T>(client: Prisma.GrantDelegate<T>) =>
  (id: GrantId) =>
    pipe(
      TE.tryCatch(() => client.findUnique({ where: { id } }), E.toError),
      TE.map(flow(O.fromNullable, O.map(fromRecord))),
      TE.mapLeft((e) => ({
        causedBy: e,
        kind: DomainErrorTypes.GENERIC_ERROR,
      })),
      TE.chainFirst((c) =>
        TE.of(logger.debug(`findClient ${JSON.stringify(c)}`))
      ),
      TE.orElseFirst((e) =>
        TE.of(logger.error(`Error on findClient ${JSON.stringify(e)}`))
      )
    );

export const makeGrantRepository = (
  config: PostgresConfig,
  logger: Logger,
  client: PrismaClient = new PrismaClient({
    datasources: { db: { url: config.url.href } },
  })
): GrantRepository => ({
  find: findGrant(logger)(client.grant),
  upsert: upsertGrant(logger)(client.grant),
});
