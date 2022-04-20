import * as mock from "jest-mock-extended";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { Logger } from "../../logger";
import { GrantService } from "../../grants/GrantService";
import { ClientService } from "../../clients/ClientService";
import {
  makeRenderData,
  ProcessConsentUseCase,
} from "../ProcessConsentUseCase";
import {
  afterLoginInteraction,
  interaction,
} from "../../interactions/__tests__/data";
import { client } from "../../clients/__tests__/data";
import { grant } from "../../grants/__tests__/data";

const makeProcessConsentUseCaseTest = () => {
  const logger = mock.mock<Logger>();
  const clientServiceMock = mock.mock<ClientService>();
  const grantServiceMock = mock.mock<GrantService>();
  const useCase = ProcessConsentUseCase(
    logger,
    clientServiceMock,
    grantServiceMock
  );
  return { logger, clientServiceMock, grantServiceMock, useCase };
};

describe("ProcessConsentUseCase", () => {
  it("should return error if the client doesn't exists", async () => {
    const { useCase, clientServiceMock, grantServiceMock } =
      makeProcessConsentUseCaseTest();

    const clientFind = clientServiceMock.find.mockReturnValueOnce(
      TE.right(O.none)
    );
    const grantList = grantServiceMock.findBy.mockReturnValueOnce(TE.right([]));

    const actual = await useCase(afterLoginInteraction)();
    const expected = E.left("error");
    expect(actual).toStrictEqual(expected);
    expect(clientFind).toBeCalledWith(client.clientId);
    expect(clientFind).toBeCalledTimes(1);
    expect(grantList).toBeCalledTimes(0);
  });
  it("should return error if the interaction is not after login", async () => {
    const { useCase, clientServiceMock, grantServiceMock } =
      makeProcessConsentUseCaseTest();

    const clientFind = clientServiceMock.find.mockReturnValueOnce(
      TE.right(O.some(client))
    );
    const grantList = grantServiceMock.findBy.mockReturnValueOnce(TE.right([]));

    const actual = await useCase(interaction)();
    const expected = E.left("error");
    expect(actual).toStrictEqual(expected);
    expect(clientFind).toBeCalledWith(client.clientId);
    expect(clientFind).toBeCalledTimes(1);
    expect(grantList).toBeCalledTimes(0);
  });
  it("should return the information about the consent", async () => {
    const { useCase, clientServiceMock, grantServiceMock } =
      makeProcessConsentUseCaseTest();

    const clientFind = clientServiceMock.find.mockReturnValueOnce(
      TE.right(O.some(client))
    );
    const grantList = grantServiceMock.findBy.mockReturnValueOnce(TE.right([]));

    const actual = await useCase(afterLoginInteraction)();
    const expected = E.right(
      E.left(makeRenderData(afterLoginInteraction)(client))
    );
    expect(actual).toStrictEqual(expected);
    expect(clientFind).toBeCalledTimes(1);
    expect(grantList).toBeCalledTimes(1);
  });
  it("should return the grant remembered if any", async () => {
    const { useCase, clientServiceMock, grantServiceMock } =
      makeProcessConsentUseCaseTest();

    const clientFind = clientServiceMock.find.mockReturnValueOnce(
      TE.right(O.some(client))
    );
    const grantList = grantServiceMock.findBy.mockReturnValueOnce(
      TE.right([grant])
    );

    const actual = await useCase(afterLoginInteraction)();
    const expected = E.right(E.right(grant));
    expect(actual).toStrictEqual(expected);
    expect(clientFind).toBeCalledTimes(1);
    expect(grantList).toBeCalledWith({
      clientId: O.some(client.clientId),
      identityId: grant.subjects.identityId,
      remember: true,
    });
    expect(grantList).toBeCalledTimes(1);
  });
});
