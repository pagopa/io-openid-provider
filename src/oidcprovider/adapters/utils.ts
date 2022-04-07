import * as oidc from "oidc-provider";
import * as t from "io-ts";
import { pipe } from "fp-ts/function";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { Logger } from "../../logger";
import { DomainError } from "../../core/domain";

export const taskEitherToPromise = async <B>(
  te: TE.TaskEither<DomainError, B>
): Promise<B> => {
  const either = await te();
  return pipe(
    either,
    E.fold(
      (l) => Promise.reject(l.causedBy),
      (r) => Promise.resolve(r)
    )
  );
};

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
        payload
      )}`
    );
    return promiseRejected();
  },
});

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
