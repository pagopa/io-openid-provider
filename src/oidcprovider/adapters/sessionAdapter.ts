import * as oidc from "oidc-provider";
import { constVoid, pipe } from "fp-ts/function";
import * as t from "io-ts";
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
  DateFromNumericDate,
} from "./utils";

export const SessionPayload = t.type({
  accountId: t.union([AccountId, t.undefined]),
  exp: DateFromNumericDate,
  iat: DateFromNumericDate,
  jti: SessionId,
  kind: t.literal("Session"),
  loginTs: DateFromNumericDate,
  uid: t.string,
});

export const toAdapterPayload = (entity: Session): oidc.AdapterPayload =>
  SessionPayload.encode({
    accountId: entity.accountId,
    exp: entity.expireAt,
    iat: entity.issuedAt,
    jti: entity.id,
    kind: "Session",
    loginTs: entity.issuedAt,
    uid: entity.uid,
  });

export const fromAdapterPayload = (
  payload: oidc.AdapterPayload
): t.Validation<Session> =>
  pipe(
    SessionPayload.decode(payload),
    E.map((sessionPayload) => ({
      accountId: sessionPayload.accountId,
      expireAt: sessionPayload.exp,
      id: sessionPayload.jti,
      issuedAt: sessionPayload.iat,
      kind: sessionPayload.kind,
      uid: sessionPayload.uid,
    }))
  );

export const makeSessionAdapter = (
  logger: Logger,
  sessionRepository: SessionRepository
) => ({
  ...makeNotImplementedAdapter("Session", logger),
  // remove a session
  destroy: (id: string) => {
    logger.debug(`Session destroy, id: ${id}`);
    const result = pipe(
      pipe(SessionId.decode(id), E.mapLeft(makeDomainError), TE.fromEither),
      TE.chain(sessionRepository.remove)
    );
    return taskEitherToPromise(result);
  },
  // given the identifier return a session
  find: (id: string) => {
    logger.debug(`Session find, id: ${id}`);
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
    logger.debug(`Session findByUid, id: ${uid}`);
    const result = pipe(
      sessionRepository.findByUid(uid),
      TE.map(O.map(toAdapterPayload)),
      TE.map(O.toUndefined)
    );
    return taskEitherToPromise(result);
  },
  // insert or update the session identified with the given id
  upsert: (id: string, payload: oidc.AdapterPayload, expiresIn: number) => {
    logger.debug(
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
