import { constVoid, pipe } from "fp-ts/lib/function.js";
import * as TE from "fp-ts/lib/TaskEither.js";
import { InteractionService } from "../domain/interactions/InteractionService.js";
import { InteractionId } from "../domain/interactions/types.js";
import { Logger } from "../domain/logger/index.js";
import { DomainError } from "../domain/types/index.js";
import { fromTEOtoTE, show } from "../domain/utils.js";

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
export type AbortInteractionUseCase = ReturnType<
  typeof AbortInteractionUseCase
>;
