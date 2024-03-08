import { vi, describe, it, expect } from "vitest";

import * as O from "fp-ts/lib/Option.js";
import * as E from "fp-ts/lib/Either.js";
import * as TE from "fp-ts/lib/TaskEither.js";
import { ListGrantUseCase } from "../ListGrantUseCase";
import { grant } from "../../domain/grants/__tests__/data";

import { grantService } from "../../adapters/vitest";

const mocks = {
  grantService,
};

describe("ListGrantUseCase", () => {
  it("should call grant list as expected", async () => {
    const useCase = ListGrantUseCase(mocks.grantService);

    const selector = {
      clientId: O.none,
      identityId: grant.subjects.identityId,
      remember: true,
    };

    vi.spyOn(mocks.grantService, "findBy").mockReturnValueOnce(
      TE.right([grant])
    );

    const actual = await useCase(selector.identityId)();
    expect(actual).toStrictEqual(E.right([grant]));
    expect(mocks.grantService.findBy).toBeCalledWith(selector);
    expect(mocks.grantService.findBy).toBeCalledTimes(1);
  });
});
