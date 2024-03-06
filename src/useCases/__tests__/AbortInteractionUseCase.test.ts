import { vi, describe, it, expect } from "vitest";

import { constVoid } from "fp-ts/lib/function";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";

import { DomainErrorTypes, makeDomainError } from "../../domain/types";

import { interaction } from "../../domain/interactions/__tests__/data";
import { interactionService } from "../../adapters/vitest";
import { makeLogger } from "../../adapters/winston/index";

import { AbortInteractionUseCase } from "../AbortInteractionUseCase";

const mocks = {
  interactionService,
  logger: makeLogger({
    logLevel: "info",
    logName: "AbortInteractionUseCase.test",
  }),
};

describe("AbortInteractionUseCase", () => {
  it("should return an error if interaction is not found", async () => {
    const useCase = AbortInteractionUseCase(
      mocks.logger,
      mocks.interactionService
    );

    vi.spyOn(mocks.interactionService, "find").mockReturnValueOnce(
      TE.right(O.none)
    );

    const actual = await useCase(interaction.id)();
    expect(actual).toStrictEqual(
      E.left(makeDomainError("Not Found", DomainErrorTypes.NOT_FOUND))
    );
    expect(mocks.interactionService.find).toBeCalledWith(interaction.id);
    expect(mocks.interactionService.find).toHaveBeenCalledTimes(1);
  });

  it("should execute the abort steps", async () => {
    const useCase = AbortInteractionUseCase(
      mocks.logger,
      mocks.interactionService
    );

    vi.spyOn(mocks.interactionService, "find").mockReturnValueOnce(
      TE.right(O.some(interaction))
    );

    const actual = await useCase(interaction.id)();
    expect(actual).toStrictEqual(E.right(constVoid()));
    expect(mocks.interactionService.find).toBeCalledWith(interaction.id);
    expect(mocks.interactionService.find).toBeCalledTimes(1);
  });
});
