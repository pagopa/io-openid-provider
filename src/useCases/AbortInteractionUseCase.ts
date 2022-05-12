import { constVoid, pipe } from "fp-ts/function";
import * as TE from "fp-ts/TaskEither";
import { InteractionService } from "../domain/interactions/InteractionService";
import { InteractionId } from "../domain/interactions/types";
import { Logger } from "../domain/logger";
import { DomainError } from "../domain/types";
import { fromTEOtoTE, show } from "../domain/utils";

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
