import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { ClientListUseCase } from "../ClientListUseCase";
import { client } from "../../domain/clients/__tests__/data";
import { describe, it, expect } from "vitest";
import { loggerMock } from "../../__mock__/logger";
import { clientServiceMock } from "../../__mock__/client";

const makeClientListUseCaseTest = () => {
  const useCase = ClientListUseCase(loggerMock, clientServiceMock);
  return { loggerMock, clientServiceMock, useCase };
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
