import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { ListGrantUseCase } from "../ListGrantUseCase";
import { grant } from "../../domain/grants/__tests__/data";
import { describe, it, expect } from "vitest";
import { grantServiceMock } from "../../__mock__/grant";
import { loggerMock } from "../../__mock__/logger";

const makeListGrantUseCaseTest = () => {
  const useCase = ListGrantUseCase(grantServiceMock);
  return { loggerMock, grantServiceMock, useCase };
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
