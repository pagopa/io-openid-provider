import { pipe } from "fp-ts/function";
import * as TE from "fp-ts/TaskEither";
import { Client } from "../clients/types";
import { ClientSelector, ClientService } from "../clients/ClientService";
import { Logger } from "../logger";
import { DomainErrorTypes } from "../types";
import { show } from "../utils";

export type ClientListError = DomainErrorTypes;

/**
 * Given a selector return a list of client that matches the given selector
 */
export const ClientListUseCase =
  (logger: Logger, clientService: ClientService) =>
  (
    selector: ClientSelector
  ): TE.TaskEither<ClientListError, ReadonlyArray<Client>> =>
    pipe(
      clientService.list(selector),
      TE.mapLeft((error) => {
        logger.error(`ClientListUseCase error; ${show(error)}`, error);
        return error.kind;
      })
    );
