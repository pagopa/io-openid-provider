import * as prisma from "@prisma/client";
import { Prisma, PrismaClient } from "@prisma/client";
import * as t from "io-ts";
import { constVoid, flow, pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { Logger } from "../../logger";
import { InteractionRepository } from "../../core/repositories/InteractionRepository";
import {
  DomainErrorTypes,
  Interaction,
  InteractionId,
  makeDomainError,
} from "../../core/domain";
import { PostgresConfig } from "./domain";

const toRecord = (input: Interaction): prisma.Interaction => ({
  accountId: input.session ? input.session.accountId : null,
  clientId: input.clientId,
  cookieId: input.session ? input.session.cookieId : null,
  expireAt: new Date(input.expireAt),
  id: input.id,
  issuedAt: new Date(input.issuedAt),
  params: input.params,
  prompt: input.prompt,
  result: input.result || null,
  returnTo: input.returnTo,
  uid: input.session ? input.session.uid : null,
});

// FIXME: The "as *"" casts are not very elegant solution, find a better one
const fromRecord = (record: prisma.Interaction): t.Validation<Interaction> =>
  Interaction.decode({
    clientId: record.clientId,
    expireAt: record.expireAt.getTime(),
    id: record.id,
    issuedAt: record.issuedAt.getTime(),
    params: record.params,
    prompt: record.prompt,
    result: record.result || undefined,
    returnTo: record.returnTo,
    session:
      record.accountId && record.cookieId && record.uid
        ? {
            accountId: record.accountId,
            cookieId: record.cookieId,
            uid: record.uid,
          }
        : undefined,
  } as Interaction);

const removeInteraction =
  (logger: Logger) =>
  <T>(client: Prisma.InteractionDelegate<T>) =>
  (id: InteractionId) =>
    pipe(
      TE.tryCatch(
        () =>
          client.delete({
            where: { id },
          }),
        E.toError
      ),
      TE.orElseFirst((e) =>
        TE.of(logger.error(`Error on removeInteraction`, e))
      ),
      TE.bimap(
        (e) => ({ causedBy: e, kind: DomainErrorTypes.GENERIC_ERROR }),
        constVoid
      )
    );

const upsertInteraction =
  (logger: Logger) =>
  <T>(client: Prisma.InteractionDelegate<T>) =>
  (grant: Interaction) =>
    pipe(
      TE.tryCatch(
        () =>
          client.upsert({
            create: {
              ...toRecord(grant),
              params: toRecord(grant).params as Prisma.InputJsonValue,
              prompt: toRecord(grant).prompt as Prisma.InputJsonValue,
              result: toRecord(grant).result || Prisma.DbNull,
            },
            update: {
              ...toRecord(grant),
              params: toRecord(grant).params as Prisma.InputJsonValue,
              prompt: toRecord(grant).prompt as Prisma.InputJsonValue,
              result: toRecord(grant).result || Prisma.DbNull,
            },
            where: { id: grant.id },
          }),
        E.toError
      ),
      TE.orElseFirst((e) =>
        TE.of(
          logger.error(`Error on upsertInteraction ${JSON.stringify(e)}`, e)
        )
      ),
      TE.bimap(
        (e) => ({ causedBy: e, kind: DomainErrorTypes.GENERIC_ERROR }),
        (_) => grant
      )
    );

const findInteraction =
  (logger: Logger) =>
  <T>(client: Prisma.InteractionDelegate<T>) =>
  (id: InteractionId) =>
    pipe(
      TE.tryCatch(() => client.findUnique({ where: { id } }), E.toError),
      TE.map(
        flow(
          O.fromNullable,
          O.map(fromRecord),
          O.sequence(E.Applicative),
          E.mapLeft(makeDomainError),
          TE.fromEither
        )
      ),
      TE.mapLeft((e) => ({
        causedBy: e,
        kind: DomainErrorTypes.GENERIC_ERROR,
      })),
      TE.flatten,
      TE.chainFirst((c) =>
        TE.of(logger.debug(`findInteraction ${JSON.stringify(c)}`))
      ),
      TE.orElseFirst((e) =>
        TE.of(logger.error(`Error on findInteraction ${JSON.stringify(e)}`))
      )
    );

export const makeInteractionRepository = (
  config: PostgresConfig,
  logger: Logger,
  client: PrismaClient = new PrismaClient({
    datasources: { db: { url: config.url.href } },
  })
): InteractionRepository => ({
  find: findInteraction(logger)(client.interaction),
  remove: removeInteraction(logger)(client.interaction),
  upsert: upsertInteraction(logger)(client.interaction),
});
