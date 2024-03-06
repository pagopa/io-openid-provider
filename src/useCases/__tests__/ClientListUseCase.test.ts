import { vi, describe, it, expect } from "vitest";

import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";

import { ClientListUseCase } from "../ClientListUseCase";

import { client } from "../../domain/clients/__tests__/data";

import { clientService } from "../../adapters/vitest";
import { makeLogger } from "../../adapters/winston";

const mocks = {
  clientService,
  logger: makeLogger({ logLevel: "info", logName: "ClientListUseCase.test" }),
};

describe("ClientListUseCase", () => {
  it("should call client list as expected", async () => {
    const useCase = ClientListUseCase(mocks.logger, mocks.clientService);

    const selector = {
      serviceId: O.some(client.clientId.serviceId),
      organizationId: O.some(client.clientId.organizationId),
    };

    vi.spyOn(mocks.clientService, "list").mockReturnValueOnce(
      TE.right([client])
    );

    const actual = await useCase(selector)();
    expect(actual).toStrictEqual(E.right([client]));
    expect(mocks.clientService.list).toBeCalledWith(selector);
    expect(mocks.clientService.list).toBeCalledTimes(1);
  });
});
