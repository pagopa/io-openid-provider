import { constVoid, flow, pipe } from "fp-ts/lib/function.js";
import * as t from "io-ts";
import * as O from "fp-ts/lib/Option.js";
import * as E from "fp-ts/lib/Either.js";
import * as T from "fp-ts/lib/Task.js";
import * as TE from "fp-ts/lib/TaskEither.js";
import * as oidc from "oidc-provider";
import { Logger } from "../../../../domain/logger/index.js";
import {
  DomainError,
  makeDomainError,
} from "../../../../domain/types/index.js";
import { IdentityId } from "../../../../domain/identities/types.js";
import { GrantId } from "../../../../domain/grants/types.js";

export const notImplementedError = new Error("Not Implemented");

const promiseRejected = () => Promise.reject(notImplementedError);

/**
 * Create an Adapter that implements all methods returning a promise
 * rejected with an Error (Not Implemented Error).
 */
export const makeNotImplementedAdapter = (
  name: string,
  logger: Logger
): oidc.Adapter => ({
  consume: (id: string) => {
    logger.error(`${name} consume, id: ${id}`);
    return promiseRejected();
  },
  destroy: (id: string) => {
    logger.error(`${name} destroy, id: ${id}`);
    return promiseRejected();
  },
  find: (id: string) => {
    logger.error(`${name} find, id: ${id}`);
    return promiseRejected();
  },
  findByUid: (uid: string) => {
    logger.error(`${name} findByUid, uid: ${uid}`);
    return promiseRejected();
  },
  findByUserCode: (userCode: string) => {
    logger.error(`${name} findByUserCode, userCode: ${userCode}`);
    return promiseRejected();
  },
  revokeByGrantId: (grantId: string) => {
    logger.error(`${name} revokeByGrantId, grantId: ${grantId}`);
    return promiseRejected();
  },
  upsert: (id: string, payload: oidc.AdapterPayload, expiresIn: number) => {
    logger.error(
      `${name} upsert, id: ${id}, expiresIn: ${expiresIn}, payload: ${JSON.stringify(
        payload,
        null,
        2
      )}`
    );
    return promiseRejected();
  },
});

export const destroyFromTE =
  <T0, T1>(
    logger: Logger,
    entityName: string,
    decode: (id: string) => t.Validation<T0>,
    fn: (i: T0) => TE.TaskEither<DomainError, T1>
  ) =>
  (id: string): Promise<void | undefined> =>
    pipe(
      pipe(decode(id), TE.fromEither, TE.mapLeft(makeDomainError)),
      TE.chain(fn),
      TE.bimap(
        (err) =>
          logger.error(
            `${entityName} destroy: ${JSON.stringify(err, null, 2)}`,
            err.causedBy
          ),
        (res) =>
          logger.debug(
            `${entityName} destroy: id (${id}) ${JSON.stringify(res, null, 2)}`
          )
      ),
      TE.toUnion,
      T.map((_) => constVoid())
    )();

export const findFromTEO =
  <T0, T1>(
    logger: Logger,
    entityName: string,
    decodeT0: (id: string) => t.Validation<T0>,
    decodeT1: (t1: T1) => oidc.AdapterPayload,
    fn: (i: T0) => TE.TaskEither<DomainError, O.Option<T1>>
  ) =>
  (id: string): Promise<oidc.AdapterPayload | undefined> =>
    pipe(
      pipe(decodeT0(id), TE.fromEither, TE.mapLeft(makeDomainError)),
      TE.chain(flow(fn, TE.map(O.map(decodeT1)))),
      TE.fold(
        (err) => {
          logger.error(
            `${entityName} find: ${JSON.stringify(err, null, 2)}`,
            err.causedBy
          );
          return () => Promise.reject(err.causedBy);
        },
        (res) => {
          logger.debug(
            `${entityName} find: id (${id}) ${JSON.stringify(res, null, 2)}`
          );
          return () => Promise.resolve(O.toUndefined(res));
        }
      )
    )();

export const upsertFromTE =
  <T0, T1>(
    logger: Logger,
    entityName: string,
    decodeT0: (payload: oidc.AdapterPayload) => t.Validation<T0>,
    fn: (i: T0) => TE.TaskEither<DomainError, T1>
  ) =>
  (
    id: string,
    payload: oidc.AdapterPayload,
    expiresIn: number
  ): Promise<void> =>
    pipe(
      pipe(decodeT0(payload), TE.fromEither, TE.mapLeft(makeDomainError)),
      TE.chain(fn),
      TE.fold(
        (err) => {
          logger.error(
            `${entityName} upsert: ${JSON.stringify(
              err,
              null,
              2
            )}\n Payload was: ${JSON.stringify(payload, null, 2)}`,
            err.causedBy
          );
          return () => Promise.reject(err.causedBy);
        },
        (res) => {
          logger.debug(
            `${entityName} upsert: id (${id}), expiresIn (${expiresIn}), payload ${JSON.stringify(
              payload,
              null,
              2
            )}\ndecoded: ${JSON.stringify(res, null, 2)}`
          );
          return () => Promise.resolve(constVoid());
        }
      )
    )();

const separator = ":";
// This type is useful when you need to keep in a simple string both values
// identityId and grantId
export const IdentityIdAndGrantId = new t.Type<
  readonly [IdentityId, GrantId],
  string
>(
  "IdentityIdAndGrantId",
  (s): s is readonly [IdentityId, GrantId] =>
    t.tuple([IdentityId, GrantId]).is(s),
  (s, c) =>
    pipe(
      t.string.validate(s, c),
      E.chain((str) => {
        const [idn, grn] = str.split(separator);
        const makeIdnAndGrn = (identityId: IdentityId) => (grantId: GrantId) =>
          [identityId, grantId] as const;
        return pipe(
          E.of(makeIdnAndGrn),
          E.ap(IdentityId.decode(idn)),
          E.ap(GrantId.decode(grn))
        );
      })
    ),
  ([identityId, grantId]) => `${identityId}${separator}${grantId}`
);
export type IdentityIdAndGrantId = t.TypeOf<typeof IdentityIdAndGrantId>;

/**
 * Accepts a NumericDate.
 * Given a date return the number of seconds from 1970-01-01T00:00:00Z UTC
 * until the specified UTC date/time, ignoring leap seconds.
 *
 * Given a NumericDate returns a Date.
 * NumericDate is a numeric value representing the number of seconds from
 * 1970-01-01T00:00:00Z UTC until the specified UTC date/time,
 * ignoring leap seconds. This is equivalent to the IEEE Std 1003.1,
 * 2013 Edition [POSIX.1] definition "Seconds Since the Epoch", in
 * which each day is accounted for by exactly 86400 seconds, other
 * than that non-integer values can be represented.
 */
export const DateFromNumericDate = new t.Type<Date, number>(
  "DateFromNumericDate",
  (v): v is Date => v instanceof Date,
  (v, c) =>
    pipe(
      t.number.validate(v, c),
      E.chain((n) => {
        const date = new Date(n * 1000);
        return isNaN(date.getTime()) ? t.failure(n, c) : t.success(date);
      })
    ),
  (date) => date.getTime() / 1000
);
