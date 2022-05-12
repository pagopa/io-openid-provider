import * as mock from "jest-mock-extended";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { GrantService } from "../../grants/GrantService";
import { Logger } from "../../logger";
import { RemoveGrantUseCase } from "../RemoveGrantUseCase";
import { client } from "../../clients/__tests__/data";
import { identity } from "../../identities/__tests__/data";
import { grant } from "../../grants/__tests__/data";
import { makeDomainError, makeNotFoundError } from "../../types";
import { constVoid } from "fp-ts/lib/function";

const makeRemoveGrantUseCaseTest = () => {
  const logger = mock.mock<Logger>();
  const grantServiceMock = mock.mock<GrantService>();
  const useCase = RemoveGrantUseCase(logger, grantServiceMock);
  return { logger, grantServiceMock, useCase };
};

describe("RemoveGrantUseCase", () => {
  it("should call find and then the remove for each one", async () => {
    const { useCase, grantServiceMock } = makeRemoveGrantUseCaseTest();

    const grantFindMock = grantServiceMock.findBy.mockReturnValueOnce(
      TE.right([grant, grant])
    );
    const grantRemoveMock = grantServiceMock.remove.mockReturnValue(
      TE.right(constVoid())
    );

    const actual = await useCase(
      client.clientId.organizationId,
      client.clientId.serviceId,
      identity.id
    )();

    expect(actual).toStrictEqual(E.right(constVoid()));
    expect(grantFindMock).toBeCalledWith({
      clientId: O.some(client.clientId),
      identityId: identity.id,
      remember: true,
    });
    expect(grantFindMock).toBeCalledTimes(1);
    expect(grantRemoveMock).toBeCalledTimes(2);
  });
  it("should map the empty array to NotFound", async () => {
    const { useCase, grantServiceMock } = makeRemoveGrantUseCaseTest();

    const grantFindMock = grantServiceMock.findBy.mockReturnValueOnce(
      TE.right([])
    );
    const actual = await useCase(
      client.clientId.organizationId,
      client.clientId.serviceId,
      identity.id
    )();

    expect(actual).toStrictEqual(E.left(makeNotFoundError("Grant not found")));
    expect(grantFindMock).toBeCalledTimes(1);
  });
  it("should map Errors", async () => {
    const { useCase, grantServiceMock } = makeRemoveGrantUseCaseTest();

    const grantFindMock = grantServiceMock.findBy.mockReturnValueOnce(
      TE.left(makeDomainError("error"))
    );
    const actual = await useCase(
      client.clientId.organizationId,
      client.clientId.serviceId,
      identity.id
    )();

    expect(actual).toStrictEqual(E.left(makeDomainError("error")));
    expect(grantFindMock).toBeCalledTimes(1);
  });
});
