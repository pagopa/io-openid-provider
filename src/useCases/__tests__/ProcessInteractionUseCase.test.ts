import { vi, describe, it, expect } from "vitest";

import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";

import { ProcessInteractionUseCase } from "../ProcessInteractionUseCase";
import {
  afterLoginInteraction,
  interaction,
} from "../../domain/interactions/__tests__/data";
import { identity } from "../../domain/identities/__tests__/data";
import { client } from "../../domain/clients/__tests__/data";
import { grant } from "../../domain/grants/__tests__/data";
import { config } from "../../__tests__/data";

import { makeNotFoundError } from "../../domain/types";

import {
  identityService,
  interactionService,
  clientService,
  grantService,
} from "../../adapters/vitest";
import { makeLogger } from "../../adapters/winston";

const mocks = {
  identityService,
  interactionService,
  clientService,
  grantService,
  logger: makeLogger({
    logLevel: "info",
    logName: "ProcessInteractionUseCase.test",
  }),
};

describe("ProcessInteractionUseCase", () => {
  it("should return error if the client doesn't exists", async () => {
    const useCase = ProcessInteractionUseCase(
      mocks.logger,
      config.features,
      mocks.identityService,
      mocks.interactionService,
      mocks.clientService,
      mocks.grantService
    );

    vi.spyOn(mocks.interactionService, "find").mockReturnValueOnce(
      TE.right(O.some(afterLoginInteraction))
    );

    vi.spyOn(mocks.clientService, "find").mockReturnValueOnce(TE.right(O.none));

    vi.spyOn(mocks.grantService, "findBy").mockReturnValueOnce(TE.right([]));

    const actual = await useCase(afterLoginInteraction.id, () => "")();
    const expected = E.left(makeNotFoundError("Client not found"));
    expect(actual).toStrictEqual(expected);
    expect(mocks.interactionService.find).toBeCalledWith(
      afterLoginInteraction.id
    );
    expect(mocks.interactionService.find).toBeCalledTimes(1);
    expect(mocks.clientService.find).toBeCalledWith(client.clientId);
    expect(mocks.clientService.find).toBeCalledTimes(1);
  });

  it("should try authentication if the interaction has no identity", async () => {
    const useCase = ProcessInteractionUseCase(
      mocks.logger,
      config.features,
      mocks.identityService,
      mocks.interactionService,
      mocks.clientService,
      mocks.grantService
    );

    vi.spyOn(mocks.interactionService, "find").mockReturnValueOnce(
      TE.right(O.some(interaction))
    );

    vi.spyOn(mocks.identityService, "authenticate").mockReturnValueOnce(
      TE.right(identity)
    );

    const actual = await useCase(interaction.id, () => "")();
    const expected = E.right({ identity: identity, kind: "LoginResult" });
    expect(actual).toStrictEqual(expected);
  });

  it("should return the information about the consent", async () => {
    const useCase = ProcessInteractionUseCase(
      mocks.logger,
      config.features,
      mocks.identityService,
      mocks.interactionService,
      mocks.clientService,
      mocks.grantService
    );

    vi.spyOn(mocks.interactionService, "find").mockReturnValueOnce(
      TE.right(O.some(afterLoginInteraction))
    );

    vi.spyOn(mocks.clientService, "find").mockReturnValueOnce(
      TE.right(O.some(client))
    );

    vi.spyOn(mocks.grantService, "findBy").mockReturnValueOnce(TE.right([]));

    const actual = await useCase(afterLoginInteraction.id, () => "")();
    const expected = E.right({
      allowRemembering: true,
      client: client,
      interactionId: interaction.id,
      kind: "CollectConsent",
      missingScope: interaction.params.scope?.split(" "),
    });
    expect(actual).toStrictEqual(expected);
    expect(mocks.clientService.find).toBeCalledTimes(1);
    expect(mocks.grantService.findBy).toBeCalledTimes(1);
  });

  it("should reject invalid remembered grant", async () => {
    const useCase = ProcessInteractionUseCase(
      mocks.logger,
      config.features,
      mocks.identityService,
      mocks.interactionService,
      mocks.clientService,
      mocks.grantService
    );

    vi.spyOn(mocks.interactionService, "find").mockReturnValueOnce(
      TE.right(O.some(afterLoginInteraction))
    );

    vi.spyOn(mocks.clientService, "find").mockReturnValueOnce(
      TE.right(O.some(client))
    );

    vi.spyOn(mocks.grantService, "findBy").mockReturnValueOnce(
      TE.right([{ ...grant, expireAt: grant.issuedAt }])
    );

    const actual = await useCase(afterLoginInteraction.id, () => "")();
    const expected = E.right({
      allowRemembering: true,
      client: client,
      interactionId: interaction.id,
      kind: "CollectConsent",
      missingScope: interaction.params.scope?.split(" "),
    });
    expect(actual).toStrictEqual(expected);
    expect(mocks.clientService.find).toBeCalledTimes(1);
    expect(mocks.grantService.findBy).toBeCalledWith({
      clientId: O.some(client.clientId),
      identityId: grant.subjects.identityId,
      remember: true,
    });
    expect(mocks.grantService.findBy).toBeCalledTimes(1);
  });

  it("should return the information about the consent", async () => {
    const { grantTTL } = config.features.grant;

    const useCase = ProcessInteractionUseCase(
      mocks.logger,
      {
        ...config.features,
        grant: { enableRememberGrantFeature: false, grantTTL },
      },
      mocks.identityService,
      mocks.interactionService,
      mocks.clientService,
      mocks.grantService
    );

    vi.spyOn(mocks.interactionService, "find").mockReturnValueOnce(
      TE.right(O.some(afterLoginInteraction))
    );

    vi.spyOn(mocks.clientService, "find").mockReturnValueOnce(
      TE.right(O.some(client))
    );

    vi.spyOn(mocks.grantService, "findBy").mockReturnValueOnce(TE.right([]));

    const actual = await useCase(afterLoginInteraction.id, () => "")();
    const expected = E.right({
      allowRemembering: false,
      client: client,
      interactionId: interaction.id,
      kind: "CollectConsent",
      missingScope: interaction.params.scope?.split(" "),
    });
    expect(actual).toStrictEqual(expected);
  });

  it("should return the grant remembered if any", async () => {
    const useCase = ProcessInteractionUseCase(
      mocks.logger,
      config.features,
      mocks.identityService,
      mocks.interactionService,
      mocks.clientService,
      mocks.grantService
    );

    vi.spyOn(mocks.interactionService, "find").mockReturnValueOnce(
      TE.right(O.some(afterLoginInteraction))
    );

    vi.spyOn(mocks.clientService, "find").mockReturnValueOnce(
      TE.right(O.some(client))
    );

    vi.spyOn(mocks.grantService, "findBy").mockReturnValueOnce(
      TE.right([grant])
    );

    const actual = await useCase(afterLoginInteraction.id, () => "")();
    const expected = E.right({ grant: grant, kind: "ConsentResult" });
    expect(actual).toStrictEqual(expected);
    expect(mocks.clientService.find).toBeCalledTimes(0);
    expect(mocks.grantService.findBy).toBeCalledWith({
      clientId: O.some(client.clientId),
      identityId: grant.subjects.identityId,
      remember: true,
    });
    expect(mocks.grantService.findBy).toBeCalledTimes(1);
  });
});
