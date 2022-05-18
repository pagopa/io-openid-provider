import * as mock from "jest-mock-extended";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { Logger } from "../../domain/logger";
import { ListGrantUseCase } from "../ListGrantUseCase";
import { grant } from "../../domain/grants/__tests__/data";
import { GrantService } from "../../domain/grants/GrantService";

const makeListGrantUseCaseTest = () => {
  const logger = mock.mock<Logger>();
  const grantServiceMock = mock.mock<GrantService>();
  const useCase = ListGrantUseCase(grantServiceMock);
  return { logger, grantServiceMock, useCase };
};

describe("ListGrantUseCase", () => {
  it("should call grant list as expected", async () => {
    const { useCase, grantServiceMock } = makeListGrantUseCaseTest();
    const selector = {
      clientId: O.none,
      identityId: grant.subjects.identityId,
      remember: true,
    };

    const grantList = grantServiceMock.findBy.mockReturnValueOnce(
      TE.right([grant])
    );

    const actual = await useCase(selector.identityId)();
    expect(actual).toStrictEqual(E.right([grant]));
    expect(grantList).toBeCalledWith(selector);
    expect(grantList).toBeCalledTimes(1);
  });
});
