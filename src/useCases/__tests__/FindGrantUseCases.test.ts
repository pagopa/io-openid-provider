import { vi, describe, it, expect } from "vitest";

import * as O from "fp-ts/lib/Option.js";
import * as E from "fp-ts/lib/Either.js";
import * as TE from "fp-ts/lib/TaskEither.js";

import { FindGrantUseCase } from "../FindGrantUseCases";
import { client } from "../../domain/clients/__tests__/data";
import { identity } from "../../domain/identities/__tests__/data";
import { grant } from "../../domain/grants/__tests__/data";
import {
  makeDomainError,
  makeNotFoundError,
} from "../../domain/types/index.js";

import { grantService } from "../../adapters/vitest";
import { makeLogger } from "../../adapters/winston";

const mocks = {
  grantService,
  logger: makeLogger({ logLevel: "info", logName: "FindGrantUseCase.test" }),
};

describe("FindGrantUseCase", () => {
  it("should call the service that find a grant", async () => {
    const useCase = FindGrantUseCase(mocks.logger, mocks.grantService);

    vi.spyOn(mocks.grantService, "findBy").mockReturnValueOnce(
      TE.right([grant])
    );

    const actual = await useCase(
      client.clientId.organizationId,
      client.clientId.serviceId,
      identity.id
    )();

    expect(actual).toStrictEqual(E.right(grant));
    expect(mocks.grantService.findBy).toBeCalledWith({
      clientId: O.some(client.clientId),
      identityId: identity.id,
      remember: true,
    });
    expect(mocks.grantService.findBy).toBeCalledTimes(1);
  });
  it("should map the None with NotFound", async () => {
    const useCase = FindGrantUseCase(mocks.logger, mocks.grantService);

    vi.spyOn(mocks.grantService, "findBy").mockReturnValueOnce(TE.right([]));

    const actual = await useCase(
      client.clientId.organizationId,
      client.clientId.serviceId,
      identity.id
    )();

    expect(actual).toStrictEqual(E.left(makeNotFoundError("Grant not found")));
    expect(mocks.grantService.findBy).toBeCalledTimes(1);
  });
  it("should map Error with InternalError", async () => {
    const useCase = FindGrantUseCase(mocks.logger, mocks.grantService);

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
