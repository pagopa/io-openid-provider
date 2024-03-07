import { vi, describe, it, expect } from "vitest";

import * as E from "fp-ts/lib/Either.js";
import * as TE from "fp-ts/lib/TaskEither.js";
import { AuthenticateUseCase } from "../AuthenticateUseCase";
import { unauthorizedError } from "../../domain/types/index.js";
import { identity } from "../../domain/identities/__tests__/data";
import { makeLogger } from "../../adapters/winston";

import { identityService } from "../../adapters/vitest";

const mocks = {
  identityService,
  logger: makeLogger({
    logLevel: "info",
    logName: "AuthenticateUseCase.test",
  }),
};

describe("AuthenticateUseCase", () => {
  it("should return an error if the token is invalid", async () => {
    const useCase = AuthenticateUseCase(mocks.logger, mocks.identityService);

    const actual0 = await useCase(undefined)();
    const actual1 = await useCase("invalid")();

    expect(actual0).toStrictEqual(E.left(unauthorizedError));
    expect(actual1).toStrictEqual(E.left(unauthorizedError));
    expect(mocks.identityService.authenticate).toBeCalledWith("invalid");
    expect(mocks.identityService.authenticate).toBeCalledTimes(1);
  });

  it("should return the identity if the token is valid", async () => {
    const useCase = AuthenticateUseCase(mocks.logger, mocks.identityService);

    vi.spyOn(mocks.identityService, "authenticate").mockReturnValueOnce(
      TE.right(identity)
    );

    const actual = await useCase("valid")();

    expect(actual).toStrictEqual(E.right(identity));
    expect(mocks.identityService.authenticate).toBeCalledTimes(1);
  });
});
