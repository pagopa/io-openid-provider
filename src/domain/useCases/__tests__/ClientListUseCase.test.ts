import * as mock from "jest-mock-extended";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { Logger } from "../../logger";
import { ClientListUseCase } from "../ClientListUseCase";
import { ClientService } from "../../clients/ClientService";
import { client } from "../../clients/__tests__/data";

const makeClientListUseCaseTest = () => {
  const logger = mock.mock<Logger>();
  const clientServiceMock = mock.mock<ClientService>();
  const useCase = ClientListUseCase(logger, clientServiceMock);
  return { logger, clientServiceMock, useCase };
};

describe("ClientListUseCase", () => {
  it("should call client list as expected", async () => {
    const { useCase, clientServiceMock } = makeClientListUseCaseTest();
    const selector = {
      serviceId: O.some(client.clientId.serviceId),
      organizationId: O.some(client.clientId.organizationId),
    };

    const clientList = clientServiceMock.list.mockReturnValueOnce(
      TE.right([client])
    );

    const actual = await useCase(selector)();
    expect(actual).toStrictEqual(E.right([client]));
    expect(clientList).toBeCalledWith(selector);
    expect(clientList).toBeCalledTimes(1);
  });
});
