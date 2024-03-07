import { pipe } from "fp-ts/lib/function.js";
import * as TE from "fp-ts/lib/TaskEither.js";
import { Client } from "../domain/clients/types.js";
import {
  ClientSelector,
  ClientService,
} from "../domain/clients/ClientService.js";
import { Logger } from "../domain/logger/index.js";
import { DomainError } from "../domain/types/index.js";
import { show } from "../domain/utils.js";

export type ClientListUseCaseError = DomainError;

/**
 * Given a selector return a list of client that matches the given selector
 */
export const ClientListUseCase =
  (logger: Logger, clientService: ClientService) =>
  (
    selector: ClientSelector
  ): TE.TaskEither<ClientListUseCaseError, ReadonlyArray<Client>> =>
    pipe(
      clientService.list(selector),
      TE.mapLeft((error) => {
        logger.error(`ClientListUseCase error; ${show(error)}`, error);
        return error;
      })
    );
export type ClientListUseCase = ReturnType<typeof ClientListUseCase>;
