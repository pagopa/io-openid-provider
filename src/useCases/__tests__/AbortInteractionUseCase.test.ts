import { constVoid } from "fp-ts/lib/function";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { AbortInteractionUseCase } from "../AbortInteractionUseCase";
import { interaction } from "../../domain/interactions/__tests__/data";
import { DomainErrorTypes, makeDomainError } from "../../domain/types";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { loggerMock } from "../../__mock__/logger";
import { interactionServiceMock } from "../../__mock__/interaction";

beforeEach(() => vi.restoreAllMocks);

const makeAbortInteractionUseCaseTest = () => {
  const useCase = AbortInteractionUseCase(loggerMock, interactionServiceMock);
  return { loggerMock, interactionServiceMock, useCase };
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
