import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { AuthenticateUseCase } from "../AuthenticateUseCase";
import {
  DomainErrorTypes,
  makeDomainError,
  unauthorizedError,
} from "../../domain/types";
import { identity } from "../../domain/identities/__tests__/data";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { loggerMock } from "../../__mock__/logger";
import { identityServiceMock } from "../../__mock__/identity";

beforeEach(() => vi.restoreAllMocks);

const makeAuthenticateUseCaseTest = () => {
  const useCase = AuthenticateUseCase(loggerMock, identityServiceMock);
  return { loggerMock, identityServiceMock, useCase };
};

describe("AuthenticateUseCase", () => {
  it("should return an error if the token is invalid", async () => {
    const { useCase, identityServiceMock } = makeAuthenticateUseCaseTest();

    const actual0 = await useCase(undefined)();
    expect(actual0).toStrictEqual(E.left(unauthorizedError));

    const identityAuthenticate =
      identityServiceMock.authenticate.mockReturnValue(
        TE.left(makeDomainError("Error", DomainErrorTypes.GENERIC_ERROR))
      );
    const actual1 = await useCase("invalid")();
    expect(actual1).toStrictEqual(E.left(unauthorizedError));
    expect(identityAuthenticate).toBeCalledWith("invalid");
    expect(identityAuthenticate).toBeCalledTimes(1);
  });
  it("should return the identity if the token is valid", async () => {
    const { useCase, identityServiceMock } = makeAuthenticateUseCaseTest();

    const identityAuthenticate =
      identityServiceMock.authenticate.mockReturnValue(TE.right(identity));
    const actual = await useCase("valid")();
    expect(actual).toStrictEqual(E.right(identity));
    expect(identityAuthenticate).toBeCalledTimes(1);
  });
});
