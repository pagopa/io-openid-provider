import * as oidc from "oidc-provider";
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