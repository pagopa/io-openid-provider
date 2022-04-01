import * as prisma from "@prisma/client";
import { Prisma, PrismaClient } from "@prisma/client";
import * as t from "io-ts";
import { constVoid, flow, pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { Logger } from "../../logger";
import { InteractionRequestRepository } from "../../core/repositories/InteractionRequestRepository";
import {
  DomainErrorTypes,
  InteractionRequest,
  InteractionRequestId,
  makeDomainError,
} from "../../core/domain";
import { PostgresConfig } from "./domain";

const toRecord = (input: InteractionRequest): prisma.InteractionRequest => ({
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
const fromRecord = (
  record: prisma.InteractionRequest
): t.Validation<InteractionRequest> =>
  InteractionRequest.decode({
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
  } as InteractionRequest);

const removeInteractionRequest =
  (logger: Logger) =>
  <T>(client: Prisma.InteractionRequestDelegate<T>) =>
  (id: InteractionRequestId) =>
    pipe(
      TE.tryCatch(
        () =>
          client.delete({
            where: { id },
          }),
        E.toError
      ),
      TE.orElseFirst((e) =>
        TE.of(logger.error(`Error on removeInteractionRequest`, e))
      ),
      TE.bimap(
        (e) => ({ causedBy: e, kind: DomainErrorTypes.GENERIC_ERROR }),
        constVoid
      )
    );

const upsertInteractionRequest =
  (logger: Logger) =>
  <T>(client: Prisma.InteractionRequestDelegate<T>) =>
  (grant: InteractionRequest) =>
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
          logger.error(
            `Error on upsertInteractionRequest ${JSON.stringify(e)}`,
            e
          )
        )
      ),
      TE.bimap(
        (e) => ({ causedBy: e, kind: DomainErrorTypes.GENERIC_ERROR }),
        (_) => grant
      )
    );

const findInteractionRequest =
  (logger: Logger) =>
  <T>(client: Prisma.InteractionRequestDelegate<T>) =>
  (id: InteractionRequestId) =>
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
        TE.of(logger.debug(`findInteractionRequest ${JSON.stringify(c)}`))
      ),
      TE.orElseFirst((e) =>
        TE.of(
          logger.error(`Error on findInteractionRequest ${JSON.stringify(e)}`)
        )
      )
    );

export const makeInteractionRequestRepository = (
  config: PostgresConfig,
  logger: Logger,
  client: PrismaClient = new PrismaClient({
    datasources: { db: { url: config.url.href } },
  })
): InteractionRequestRepository => ({
  find: findInteractionRequest(logger)(client.interactionRequest),
  remove: removeInteractionRequest(logger)(client.interactionRequest),
  upsert: upsertInteractionRequest(logger)(client.interactionRequest),
});
