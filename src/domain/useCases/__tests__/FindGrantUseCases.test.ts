import * as mock from "jest-mock-extended";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { GrantService } from "../../grants/GrantService";
import { Logger } from "../../logger";
import {
  FindGrantUseCase,
  InternalError,
  NotFound,
} from "../FindGrantUseCases";
import { client } from "../../clients/__tests__/data";
import { identity } from "../../identities/__tests__/data";
import { grant } from "../../grants/__tests__/data";
import { makeDomainError } from "../../types";

const makeFindGrantUseCaseTest = () => {
  const logger = mock.mock<Logger>();
  const grantServiceMock = mock.mock<GrantService>();
  const useCase = FindGrantUseCase(logger, grantServiceMock);
  return { logger, grantServiceMock, useCase };
};

describe("FindGrantUseCase", () => {
  it("should call the service that find a grant", async () => {
    const { useCase, grantServiceMock } = makeFindGrantUseCaseTest();

    const grantFindMock = grantServiceMock.findBy.mockReturnValueOnce(
      TE.right([grant])
    );
    const actual = await useCase(
      client.clientId.organizationId,
      client.clientId.serviceId,
      identity.id
    )();

    expect(actual).toStrictEqual(E.right(grant));
    expect(grantFindMock).toBeCalledWith({
      clientId: O.some(client.clientId),
      identityId: identity.id,
      remember: true,
    });
    expect(grantFindMock).toBeCalledTimes(1);
  });
  it("should map the None with NotFound", async () => {
    const { useCase, grantServiceMock } = makeFindGrantUseCaseTest();

    const grantFindMock = grantServiceMock.findBy.mockReturnValueOnce(
      TE.right([])
    );
    const actual = await useCase(
      client.clientId.organizationId,
      client.clientId.serviceId,
      identity.id
    )();

    expect(actual).toStrictEqual(E.left(NotFound()));
    expect(grantFindMock).toBeCalledTimes(1);
  });
  it("should map Error with InternalError", async () => {
    const { useCase, grantServiceMock } = makeFindGrantUseCaseTest();

    const grantFindMock = grantServiceMock.findBy.mockReturnValueOnce(
      TE.left(makeDomainError("error"))
    );
    const actual = await useCase(
      client.clientId.organizationId,
      client.clientId.serviceId,
      identity.id
    )();

    expect(actual).toStrictEqual(E.left(InternalError()));
    expect(grantFindMock).toBeCalledTimes(1);
  });
});
