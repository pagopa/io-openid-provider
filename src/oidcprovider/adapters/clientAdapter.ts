import * as oidc from "oidc-provider";
import { constVoid, pipe } from "fp-ts/function";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { Logger } from "src/logger";
import { ClientRepository } from "../../core/repositories/ClientRepository";
import { Client } from "../../core/domain";

const notImplementedError = new Error("Not Implemented");

const taskEitherToPromise = async <A, B>(
  te: TE.TaskEither<A, B>
): Promise<B> => {
  const either = await te();
  return pipe(
    either,
    E.fold(
      (l) => Promise.reject(l),
      (r) => Promise.resolve(r)
    )
  );
};

export const makeClientAdapter = (
  logger: Logger,
  clientRepository: ClientRepository
): oidc.Adapter => ({
  consume: (_id: string) => {
    logger.debug("consume");
    logger.debug("_id", _id);
    return Promise.reject(notImplementedError);
  },
  destroy: (id: string) => taskEitherToPromise(clientRepository.remove(id)),
  find: (_id: string) => {
    logger.debug("find");
    logger.debug("_id", _id);
    return Promise.reject(notImplementedError);
  },
  findByUid: (_uid: string) => {
    logger.debug("findByUid");
    logger.debug("_uid", _uid);
    return Promise.reject(notImplementedError);
  },
  findByUserCode: (_userCode: string) => {
    logger.debug("findByUserCode");
    logger.debug("_userCode", _userCode);
    return Promise.reject(notImplementedError);
  },
  revokeByGrantId: (_grantId: string) => {
    logger.debug("findByUid");
    logger.debug("_grantId", _grantId);
    return Promise.reject(notImplementedError);
  },
  upsert: (_id: string, payload: oidc.AdapterPayload, _expiresIn: number) => {
    logger.debug("upsert");
    logger.debug("_id", _id);
    logger.debug("payload", payload);
    logger.debug("_expiresIn", _expiresIn);

    const result = pipe(
      TE.fromEither(Client.decode(payload)),
      TE.chainW(clientRepository.upsert),
      TE.orElseFirst((e) =>
        TE.of(logger.error("Some error during the upsert operation: ", e))
      ),
      TE.map(constVoid)
    );
    return taskEitherToPromise(result);
  },
});
