import { vi, describe, it, expect } from "vitest";

import { constVoid } from "fp-ts/lib/function.js";
import * as O from "fp-ts/lib/Option.js";
import * as E from "fp-ts/lib/Either.js";
import * as TE from "fp-ts/lib/TaskEither.js";

import { RemoveGrantUseCase } from "../RemoveGrantUseCase";
import { client } from "../../domain/clients/__tests__/data";
import { identity } from "../../domain/identities/__tests__/data";
import { grant } from "../../domain/grants/__tests__/data";
import {
  makeDomainError,
  makeNotFoundError,
} from "../../domain/types/index.js";
import { makeLogger } from "../../adapters/winston";

import { grantService } from "../../adapters/vitest";

const mocks = {
  logger: makeLogger({ logLevel: "info", logName: "RemoveGrantUseCase.test" }),
  grantService,
};

describe("RemoveGrantUseCase", () => {
  it("should call find and then the remove for each one", async () => {
    const useCase = RemoveGrantUseCase(mocks.logger, mocks.grantService);

    vi.spyOn(mocks.grantService, "findBy").mockReturnValueOnce(
      TE.right([grant, grant])
    );

    vi.spyOn(mocks.grantService, "remove").mockReturnValue(
      TE.right(constVoid())
    );

    const actual = await useCase(
      client.clientId.organizationId,
      client.clientId.serviceId,
      identity.id
    )();

    expect(actual).toStrictEqual(E.right(constVoid()));
    expect(mocks.grantService.findBy).toBeCalledWith({
      clientId: O.some(client.clientId),
      identityId: identity.id,
      remember: true,
    });
    expect(mocks.grantService.findBy).toBeCalledTimes(1);
    expect(mocks.grantService.remove).toBeCalledTimes(2);
  });

  it("should map the empty array to NotFound", async () => {
    const useCase = RemoveGrantUseCase(mocks.logger, mocks.grantService);

    vi.spyOn(mocks.grantService, "findBy").mockReturnValueOnce(TE.right([]));

    const actual = await useCase(
      client.clientId.organizationId,
      client.clientId.serviceId,
      identity.id
    )();

    expect(actual).toStrictEqual(E.left(makeNotFoundError("Grant not found")));
    expect(mocks.grantService.findBy).toBeCalledTimes(1);
  });

  it("should map Errors", async () => {
    const useCase = RemoveGrantUseCase(mocks.logger, mocks.grantService);

    vi.spyOn(mocks.grantService, "findBy").mockReturnValueOnce(
      TE.left(makeDomainError("error"))
    );

    const actual = await useCase(
      client.clientId.organizationId,
      client.clientId.serviceId,
      identity.id
    )();

    expect(actual).toStrictEqual(E.left(makeDomainError("error")));
    expect(mocks.grantService.findBy).toBeCalledTimes(1);
  });
});
