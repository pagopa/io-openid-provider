import * as mock from "jest-mock-extended";
import { constVoid } from "fp-ts/lib/function";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { Logger } from "../../domain/logger";
import { AbortInteractionUseCase } from "../AbortInteractionUseCase";
import { interaction } from "../../domain/interactions/__tests__/data";
import { InteractionService } from "../../domain/interactions/InteractionService";
import { DomainErrorTypes, makeDomainError } from "../../domain/types";

const makeAbortInteractionUseCaseTest = () => {
  const logger = mock.mock<Logger>();
  const interactionServiceMock = mock.mock<InteractionService>();
  const useCase = AbortInteractionUseCase(logger, interactionServiceMock);
  return { logger, interactionServiceMock, useCase };
};

describe("AbortInteractionUseCase", () => {
  it("should return an error if interaction is not found", async () => {
    const { useCase, interactionServiceMock } =
      makeAbortInteractionUseCaseTest();

    const interactionFind = interactionServiceMock.find.mockReturnValue(
      TE.right(O.none)
    );
    const actual = await useCase(interaction.id)();
    expect(actual).toStrictEqual(
      E.left(makeDomainError("Not Found", DomainErrorTypes.NOT_FOUND))
    );
    expect(interactionFind).toBeCalledWith(interaction.id);
    expect(interactionFind).toBeCalledTimes(1);
  });
  it("should execute the abort steps", async () => {
    const { useCase, interactionServiceMock } =
      makeAbortInteractionUseCaseTest();

    const interactionFind = interactionServiceMock.find.mockReturnValue(
      TE.right(O.some(interaction))
    );
    const actual = await useCase(interaction.id)();
    expect(actual).toStrictEqual(E.right(constVoid()));
    expect(interactionFind).toBeCalledWith(interaction.id);
    expect(interactionFind).toBeCalledTimes(1);
  });
});
