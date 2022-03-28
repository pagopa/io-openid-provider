import { constVoid, pipe } from "fp-ts/function";
import * as TE from "fp-ts/TaskEither";
import { RegistrationAccessTokenRepository } from "../../core/repositories/RegistrationAccessTokenRepository";
import { Logger } from "../../logger";
import {
  ClientId,
  DomainErrorTypes,
  RegistrationAccessToken,
  RegistrationAccessTokenId,
} from "../../core/domain";

const findRegistrationAccessToken =
  (logger: Logger) => (id: RegistrationAccessTokenId) => {
    logger.debug(`findRegistrationToken id: ${id}`);
    return pipe(
      TE.fromEither(ClientId.decode(id)),
      TE.bimap(
        (_) => ({ causedBy: undefined, kind: DomainErrorTypes.GENERIC_ERROR }),
        (clientId) => ({
          clientId,
          iat: new Date(new Date().getDate() + 1).getTime(),
          id,
        })
      )
    );
  };

const upsertRegistrationAccessToken =
  (logger: Logger) => (token: RegistrationAccessToken) => {
    logger.debug(`upsertRegistrationAccessToken: ${JSON.stringify(token)}`);
    return TE.of(token);
  };

const removeRegistrationAccessToken =
  (logger: Logger) => (id: RegistrationAccessTokenId) => {
    logger.debug(`removeRegistrationAccessToken: id: ${id}`);
    return TE.of(constVoid());
  };

export const makeRegistrationAccessTokenRepository = (
  logger: Logger
): RegistrationAccessTokenRepository => ({
  find: findRegistrationAccessToken(logger),
  remove: removeRegistrationAccessToken(logger),
  upsert: upsertRegistrationAccessToken(logger),
});
