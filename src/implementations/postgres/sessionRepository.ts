import * as prisma from "@prisma/client";
import { Prisma, PrismaClient } from "@prisma/client";
import { constVoid, flow, pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import {
  AccountId,
  DomainErrorTypes,
  Session,
  SessionId,
} from "../../core/domain";
import { SessionRepository } from "../../core/repositories/SessionRepository";
import { Logger } from "../../logger";
import { PostgresConfig } from "./domain";

const fromRecord = (record: prisma.Session): Session => ({
  accountId: record.accountId as AccountId,
  expireAt: record.expireAt,
  id: record.id as SessionId,
  issuedAt: record.issuedAt,
  kind: "Session",
  uid: record.uid,
});

const toRecord = (data: Session): prisma.Session => ({
  accountId: data.accountId || null,
  expireAt: data.expireAt,
  id: data.id,
  issuedAt: data.issuedAt,
  uid: data.uid,
});

const removeSession =
  (logger: Logger) =>
  <T>(client: Prisma.SessionDelegate<T>) =>
  (id: SessionId) =>
    pipe(
      TE.tryCatch(
        () =>
          client.delete({
            where: { id },
          }),
        E.toError
      ),
      TE.orElseFirst((e) =>
        TE.of(logger.error(`Error on removeLoginRequest`, e))
      ),
      TE.bimap(
        (e) => ({ causedBy: e, kind: DomainErrorTypes.GENERIC_ERROR }),
        constVoid
      )
    );

const findSession =
  (logger: Logger) =>
  <T>(client: Prisma.SessionDelegate<T>) =>
  (id: SessionId) =>
    pipe(
      TE.tryCatch(() => client.findUnique({ where: { id } }), E.toError),
      TE.map(flow(O.fromNullable, O.map(fromRecord))),
      TE.mapLeft((e) => ({
        causedBy: e,
        kind: DomainErrorTypes.GENERIC_ERROR,
      })),
      TE.chainFirst((c) =>
        TE.of(logger.debug(`findSession ${JSON.stringify(c)}`))
      ),
      TE.orElseFirst((e) =>
        TE.of(logger.error(`Error on findSession ${JSON.stringify(e)}`))
      )
    );

const findByUidSession =
  (logger: Logger) =>
  <T>(client: Prisma.SessionDelegate<T>) =>
  (uid: string) =>
    pipe(
      TE.tryCatch(() => client.findFirst({ where: { uid } }), E.toError),
      TE.map(flow(O.fromNullable, O.map(fromRecord))),
      TE.mapLeft((e) => ({
        causedBy: e,
        kind: DomainErrorTypes.GENERIC_ERROR,
      })),
      TE.chainFirst((c) =>
        TE.of(logger.debug(`findSession ${JSON.stringify(c)}`))
      ),
      TE.orElseFirst((e) =>
        TE.of(logger.error(`Error on findSession ${JSON.stringify(e)}`))
      )
    );

const upsertSession =
  (logger: Logger) =>
  <T>(client: Prisma.SessionDelegate<T>) =>
  (entity: Session) =>
    pipe(
      TE.tryCatch(
        () =>
          client.upsert({
            create: {
              ...toRecord(entity),
            },
            update: {
              ...toRecord(entity),
            },
            where: { id: entity.id },
          }),
        E.toError
      ),
      TE.orElseFirst((e) =>
        TE.of(logger.error(`Error on upsertSession ${JSON.stringify(e)}`, e))
      ),
      TE.bimap(
        (e) => ({ causedBy: e, kind: DomainErrorTypes.GENERIC_ERROR }),
        (_) => entity
      )
    );

export const makeSessionRepository = (
  config: PostgresConfig,
  logger: Logger,
  client: PrismaClient = new PrismaClient({
    datasources: { db: { url: config.url.href } },
  })
): SessionRepository => ({
  find: findSession(logger)(client.session),
  findByUid: findByUidSession(logger)(client.session),
  remove: removeSession(logger)(client.session),
  upsert: upsertSession(logger)(client.session),
});
