import { constVoid, pipe } from "fp-ts/function";
import * as TE from "fp-ts/TaskEither";
import { InteractionService } from "../interactions/InteractionService";
import { InteractionId } from "../interactions/types";
import { Logger } from "../logger";
import { DomainError } from "../types";
import { fromTEOtoTE, show } from "../utils";

export type AbortInteractionUseCaseError = DomainError;

/**
 * Given an interaction try to abort it.
 */
export const AbortInteractionUseCase =
  (logger: Logger, interactionService: InteractionService) =>
  (
    interactionId: InteractionId
  ): TE.TaskEither<AbortInteractionUseCaseError, void> =>
    pipe(
      interactionService.find(interactionId),
      fromTEOtoTE,
      TE.bimap(
        (error) => {
          logger.error(
            `Error during AbortInteractionUseCase: ${show(error)}`,
            error.causedBy
          );
          return error;
        },
        (_) => constVoid()
      )
    );
