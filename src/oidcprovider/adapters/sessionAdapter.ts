import * as oidc from "oidc-provider";
import * as t from "io-ts";
import { constVoid, pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import {
  AccountId,
  makeDomainError,
  Session,
  SessionId,
} from "../../core/domain";
import { SessionRepository } from "../../core/repositories/SessionRepository";
import { Logger } from "../../logger";
import {
  makeNotImplementedAdapter,
  taskEitherToPromise,
  toNumericDate,
  fromNumericDate,
} from "./utils";

export const toAdapterPayload = (entity: Session): oidc.AdapterPayload => ({
  accountId: entity.accountId,
  exp: toNumericDate(entity.expireAt),
  iat: toNumericDate(entity.issuedAt),
  jti: entity.id,
  kind: "Session",
  loginTs: toNumericDate(entity.issuedAt),
  uid: entity.uid,
});

export const fromAdapterPayload = (
  payload: oidc.AdapterPayload
): t.Validation<Session> =>
  // TODO: change to decode (creating SessionPayload) and then remove the cast
  Session.decode({
    accountId: payload.accountId as AccountId,
    expireAt: fromNumericDate(payload.exp || 0),
    id: payload.jti,
    issuedAt: fromNumericDate(payload.iat || 0),
    kind: "Session",
    uid: payload.uid,
  } as Session);

export const makeSessionAdapter = (
  logger: Logger,
  sessionRepository: SessionRepository
) => ({
  ...makeNotImplementedAdapter("Session", logger),
  // remove a session
  destroy: (id: string) => {
    logger.error(`Session destroy, id: ${id}`);
    const result = pipe(
      pipe(SessionId.decode(id), E.mapLeft(makeDomainError), TE.fromEither),
      TE.chain(sessionRepository.remove)
    );
    return taskEitherToPromise(result);
  },
  // given the identifier return a session
  find: (id: string) => {
    logger.error(`Session find, id: ${id}`);
    const result = pipe(
      pipe(SessionId.decode(id), E.mapLeft(makeDomainError), TE.fromEither),
      TE.chain(sessionRepository.find),
      TE.map(O.map(toAdapterPayload)),
      TE.map(O.toUndefined),
      TE.chainFirst((_) => TE.of(logger.error(_)))
    );
    return taskEitherToPromise(result);
  },
  // given the uid return a session
  findByUid: (uid: string) => {
    logger.error(`Session findByUid, id: ${uid}`);
    const result = pipe(
      sessionRepository.findByUid(uid),
      TE.map(O.map(toAdapterPayload)),
      TE.map(O.toUndefined)
    );
    return taskEitherToPromise(result);
  },
  // insert or update the session identified with the given id
  upsert: (id: string, payload: oidc.AdapterPayload, expiresIn: number) => {
    logger.error(
      `Session upsert, id: ${id}, _expiresIn: ${expiresIn}, payload: ${JSON.stringify(
        payload
      )}`
    );
    const result = pipe(
      TE.fromEither(fromAdapterPayload(payload)),
      TE.mapLeft(makeDomainError),
      TE.orElseFirst((e) =>
        TE.of(
          logger.error("Some error during the upsert operation: ", e.causedBy)
        )
      ),
      TE.chain(sessionRepository.upsert),
      TE.map(constVoid)
    );
    return taskEitherToPromise(result);
  },
});
