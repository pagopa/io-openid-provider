import { constVoid, pipe } from "fp-ts/function";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import * as PR from "io-ts/PathReporter";
import * as oidc from "oidc-provider";
import {
  DomainErrorTypes,
  makeDomainError,
  RegistrationAccessToken,
  RegistrationAccessTokenId,
} from "../../core/domain";
import { RegistrationAccessTokenRepository } from "../../core/repositories/RegistrationAccessTokenRepository";
import { Logger } from "../../logger";
import { makeNotImplementedAdapter, taskEitherToPromise } from "./utils";

export const makeRegistrationAccessTokenAdapter = (
  logger: Logger,
  registrationAccessTokenRepository: RegistrationAccessTokenRepository,
  name: string = "RegistrationAccessToken"
): oidc.Adapter => ({
  ...makeNotImplementedAdapter(name, logger),
  // remove a token
  destroy: (id: string) => {
    logger.debug(`${name} destroy, id: ${id}`);
    const result = pipe(
      pipe(
        RegistrationAccessTokenId.decode(id),
        E.mapLeft(makeDomainError),
        TE.fromEither
      ),
      TE.chain(registrationAccessTokenRepository.remove)
    );
    // id paramter can be undefined ...
    // e.g.: If the token is not generated on client registration
    if (id) {
      return taskEitherToPromise(result);
    } else {
      return Promise.resolve(constVoid());
    }
  },
  // given the identifier return a token
  find: (id: string) => {
    logger.debug(`${name} find, id: ${id}`);
    const result = pipe(
      pipe(
        RegistrationAccessTokenId.decode(id),
        E.mapLeft(makeDomainError),
        TE.fromEither
      ),
      TE.chain(registrationAccessTokenRepository.find)
    );
    return taskEitherToPromise(result);
  },
  // insert or update the client identified with the given id
  upsert: (id: string, payload: oidc.AdapterPayload, expiresIn: number) => {
    logger.debug(
      `${name} upsert, id: ${id}, _expiresIn: ${expiresIn}, payload: ${JSON.stringify(
        payload
      )}`
    );
    const result = pipe(
      TE.fromEither(RegistrationAccessToken.decode({ ...payload, id })),
      TE.mapLeft((e) => ({
        causedBy: new Error(PR.failure(e).join("\n")),
        kind: DomainErrorTypes.GENERIC_ERROR,
      })),
      TE.orElseFirst((e) =>
        TE.of(
          logger.error("Some error during the upsert operation: ", e.causedBy)
        )
      ),
      TE.chain(registrationAccessTokenRepository.upsert),
      TE.map(constVoid),
      TE.orElse(() => TE.right(constVoid()))
    );
    return taskEitherToPromise(result);
  },
});
