import * as oidc from "oidc-provider";
import { constVoid, pipe } from "fp-ts/function";
import * as TE from "fp-ts/TaskEither";
import * as PR from "io-ts/PathReporter";
import { Logger } from "../../logger";
import { ClientRepository } from "../../core/repositories/ClientRepository";
import { Client, DomainErrorTypes } from "../../core/domain";
import { makeNotImplementedAdapter, taskEitherToPromise } from "./utils";

export const makeClientAdapter = (
  logger: Logger,
  clientRepository: ClientRepository
): oidc.Adapter => ({
  ...makeNotImplementedAdapter(logger),
  // remove a client
  destroy: (id: string) => {
    logger.debug(`destroy, id: ${id}`);
    return taskEitherToPromise(clientRepository.remove(id));
  },
  // given the identifier return a client
  find: (id: string) => {
    logger.debug(`find, id: ${id}`);
    return taskEitherToPromise(clientRepository.find(id));
  },
  // insert or update the client identified with the given id
  upsert: (id: string, payload: oidc.AdapterPayload, expiresIn: number) => {
    logger.debug(
      `upsert, id: ${id}, _expiresIn: ${expiresIn}, payload: ${JSON.stringify(
        payload
      )}`
    );
    const result = pipe(
      TE.fromEither(Client.decode(payload)),
      TE.mapLeft((e) => ({
        causedBy: new Error(PR.failure(e).join("\n")),
        kind: DomainErrorTypes.GENERIC_ERROR,
      })),
      TE.orElseFirst((e) =>
        TE.of(
          logger.error("Some error during the upsert operation: ", e.causedBy)
        )
      ),
      TE.chain(clientRepository.upsert),
      TE.map(constVoid)
    );
    return taskEitherToPromise(result);
  },
});
