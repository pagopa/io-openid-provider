import { vi, describe, it, expect } from "vitest";

import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";

import { ConfirmConsentUseCase } from "../ConfirmConsentUseCase";
import { makeNotFoundError } from "../../domain/types";
import {
  afterConsentInteraction,
  afterLoginInteraction,
  interaction,
} from "../../domain/interactions/__tests__/data";
import { config } from "../../__tests__/data";
import { grant } from "../../domain/grants/__tests__/data";

import { makeLogger } from "../../adapters/winston";

import { interactionService, grantService } from "../../adapters/vitest";

const mocks = {
  logger: makeLogger({
    logLevel: "info",
    logName: "ConfirmConsentUseCase.test",
  }),
  interactionService,
  grantService,
};

describe("ConfirmConsentUseCase", () => {
  it("should return an error if the interaction doesn't exists", async () => {
    const useCase = ConfirmConsentUseCase(
      mocks.logger,
      config.features,
      mocks.interactionService,
      mocks.grantService
    );

    vi.spyOn(mocks.interactionService, "find").mockReturnValueOnce(
      TE.right(O.none)
    );

    const actual = await useCase(interaction.id, false)();
    expect(actual).toStrictEqual(E.left(makeNotFoundError("Not Found")));
    expect(mocks.interactionService.find).toBeCalledWith(interaction.id);
  });

  it("should return a new Grant", async () => {
    const useCase = ConfirmConsentUseCase(
      mocks.logger,
      config.features,
      mocks.interactionService,
      mocks.grantService
    );

    vi.spyOn(mocks.interactionService, "find").mockReturnValueOnce(
      TE.right(O.some(afterLoginInteraction))
    );

    vi.spyOn(mocks.interactionService, "upsert").mockImplementationOnce(
      TE.right
    );

    vi.spyOn(mocks.grantService, "findBy").mockReturnValueOnce(TE.right([]));

    vi.spyOn(mocks.grantService, "upsert").mockReturnValueOnce(TE.right(grant));

    const actual = await useCase(afterLoginInteraction.id, false)();
    expect(actual).toStrictEqual(E.right(grant));
    expect(mocks.grantService.findBy).toBeCalledTimes(1);
  });

  it("should reject expired remebered grant", async () => {
    const useCase = ConfirmConsentUseCase(
      mocks.logger,
      config.features,
      mocks.interactionService,
      mocks.grantService
    );

    vi.spyOn(mocks.interactionService, "find").mockReturnValueOnce(
      TE.right(O.some(afterLoginInteraction))
    );

    vi.spyOn(mocks.interactionService, "upsert").mockImplementationOnce(
      TE.right
    );

    vi.spyOn(mocks.grantService, "findBy").mockReturnValueOnce(
      TE.right([{ ...grant, expireAt: grant.issuedAt }])
    );

    vi.spyOn(mocks.grantService, "upsert").mockImplementationOnce(TE.right);

    const actual = await useCase(afterLoginInteraction.id, false)();
    // check that the grant is different from the expired one
    expect(actual).not.toStrictEqual(E.right(grant));
    expect(mocks.grantService.findBy).toBeCalledWith({
      clientId: O.some(afterLoginInteraction.params.client_id),
      identityId: grant.subjects.identityId,
      remember: true,
    });
    expect(mocks.grantService.findBy).toBeCalledTimes(1);
  });
  it("should return the grant remebered if any", async () => {
    const useCase = ConfirmConsentUseCase(
      mocks.logger,
      config.features,
      mocks.interactionService,
      mocks.grantService
    );

    vi.spyOn(mocks.interactionService, "find").mockReturnValueOnce(
      TE.right(O.some(afterLoginInteraction))
    );

    vi.spyOn(mocks.interactionService, "upsert").mockImplementationOnce(
      TE.right
    );

    vi.spyOn(mocks.grantService, "findBy").mockReturnValueOnce(
      TE.right([grant])
    );

    vi.spyOn(mocks.grantService, "upsert").mockReturnValueOnce(TE.right(grant));

    const actual = await useCase(afterLoginInteraction.id, false)();
    expect(actual).toStrictEqual(E.right(grant));
    expect(mocks.grantService.findBy).toBeCalledWith({
      clientId: O.some(afterLoginInteraction.params.client_id),
      identityId: grant.subjects.identityId,
      remember: true,
    });
    expect(mocks.grantService.findBy).toBeCalledTimes(1);
  });

  it("should return the grant referenced by the given interaction", async () => {
    const useCase = ConfirmConsentUseCase(
      mocks.logger,
      config.features,
      mocks.interactionService,
      mocks.grantService
    );

    vi.spyOn(mocks.interactionService, "find").mockReturnValueOnce(
      TE.right(O.some(afterConsentInteraction))
    );

    vi.spyOn(mocks.interactionService, "upsert").mockImplementationOnce(
      TE.right
    );

    vi.spyOn(mocks.grantService, "upsert").mockReturnValueOnce(TE.right(grant));

    vi.spyOn(mocks.grantService, "find").mockReturnValueOnce(
      TE.right(O.some(grant))
    );

    const actual = await useCase(afterConsentInteraction.id, false)();
    expect(actual).toStrictEqual(E.right(grant));
  });

  it("should save the grant as to remember", async () => {
    const { grantTTL } = config.features.grant;

    const useCase = ConfirmConsentUseCase(
      mocks.logger,
      {
        ...config.features,
        grant: { enableRememberGrantFeature: true, grantTTL },
      },
      mocks.interactionService,
      mocks.grantService
    );

    vi.spyOn(mocks.interactionService, "find").mockReturnValueOnce(
      TE.right(O.some(afterLoginInteraction))
    );

    vi.spyOn(mocks.interactionService, "upsert").mockImplementationOnce(
      TE.right
    );

    vi.spyOn(mocks.grantService, "findBy").mockReturnValueOnce(TE.right([]));

    vi.spyOn(mocks.grantService, "upsert").mockReturnValueOnce(TE.right(grant));

    const actual = await useCase(afterLoginInteraction.id, true)();
    expect(actual).toStrictEqual(E.right(grant));
    expect(mocks.grantService.upsert).toBeCalledTimes(1);
    expect(mocks.grantService.upsert).toBeCalledWith(
      expect.objectContaining({
        remember: true,
      })
    );
  });

  it("should ignore the rememberGrant if the feature is disabled", async () => {
    const { grantTTL } = config.features.grant;

    const useCase = ConfirmConsentUseCase(
      mocks.logger,
      {
        ...config.features,
        grant: { enableRememberGrantFeature: false, grantTTL },
      },
      mocks.interactionService,
      mocks.grantService
    );

    vi.spyOn(mocks.interactionService, "find").mockReturnValueOnce(
      TE.right(O.some(afterLoginInteraction))
    );

    vi.spyOn(mocks.interactionService, "upsert").mockImplementationOnce(
      TE.right
    );

    vi.spyOn(mocks.grantService, "findBy").mockReturnValueOnce(TE.right([]));

    vi.spyOn(mocks.grantService, "upsert").mockReturnValueOnce(TE.right(grant));

    const actual = await useCase(afterLoginInteraction.id, true)();
    expect(actual).toStrictEqual(E.right(grant));
    expect(mocks.grantService.upsert).toBeCalledTimes(1);
    expect(mocks.grantService.upsert).toBeCalledWith(
      expect.objectContaining({
        remember: false,
      })
    );
  });
});
