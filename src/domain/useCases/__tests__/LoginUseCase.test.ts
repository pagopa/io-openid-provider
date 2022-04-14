import * as mock from "jest-mock-extended";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { Logger } from "../../logger";
import { LoginUseCase } from "../LoginUseCase";
import { DomainErrorTypes, makeDomainError } from "../../types";
import { IdentityService } from "../../identities/IdentityService";
import { identity } from "../../identities/__tests__/data";

const makeLoginUseCaseTest = () => {
  const logger = mock.mock<Logger>();
  const identityServiceMock = mock.mock<IdentityService>();
  const useCase = LoginUseCase(logger, identityServiceMock);
  return { logger, identityServiceMock, useCase };
};

describe("LoginUseCase", () => {
  it("should return an error if the token is invalid", async () => {
    const { useCase, identityServiceMock } = makeLoginUseCaseTest();

    const actual0 = await useCase(undefined)();
    expect(actual0).toStrictEqual(E.left("Unauthorized"));

    const identityAuthenticate =
      identityServiceMock.authenticate.mockReturnValue(
        TE.left(makeDomainError("Error", DomainErrorTypes.GENERIC_ERROR))
      );
    const actual1 = await useCase("invalid")();
    expect(actual1).toStrictEqual(E.left("Unauthorized"));
    expect(identityAuthenticate).toBeCalledWith("invalid");
    expect(identityAuthenticate).toBeCalledTimes(1);
  });
  it("should return the identity if the token is valid", async () => {
    const { useCase, identityServiceMock } = makeLoginUseCaseTest();

    const actual0 = await useCase(undefined)();
    expect(actual0).toStrictEqual(E.left("Unauthorized"));

    const identityAuthenticate =
      identityServiceMock.authenticate.mockReturnValue(TE.right(identity));
    const actual1 = await useCase("valid")();
    expect(actual1).toStrictEqual(E.right(identity));
    expect(identityAuthenticate).toBeCalledTimes(1);
  });
});
