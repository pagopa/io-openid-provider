import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { makeNotFoundError } from "../../domain/types";
import {
  afterConsentInteraction,
  afterLoginInteraction,
  interaction,
} from "../../domain/interactions/__tests__/data";
import { config } from "../../__tests__/data";
import { grant } from "../../domain/grants/__tests__/data";
import { Features } from "..";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { loggerMock } from "../../__mock__/logger";
import { interactionServiceMock } from "../../__mock__/interaction";
import { grantServiceMock } from "../../__mock__/grant";
import { ConfirmConsentUseCase } from "../ConfirmConsentUseCase";

beforeEach(() => vi.restoreAllMocks);

const makeConfirmConsentUseCaseTest = (
  features: Features = config.features
) => {
  const useCase = ConfirmConsentUseCase(
    loggerMock,
    features,
    interactionServiceMock,
    grantServiceMock
  );
  return { loggerMock, interactionServiceMock, grantServiceMock, useCase };
};

describe("ConfirmConsentUseCase", () => {
  it("should return an error if the interaction doesn't exists", async () => {
    const { useCase, interactionServiceMock } = makeConfirmConsentUseCaseTest();

    const interactionfind = interactionServiceMock.find.mockReturnValue(
      TE.right(O.none)
    );
    const actual = await useCase(interaction.id, false)();
    expect(actual).toStrictEqual(E.left(makeNotFoundError("Not Found")));
    expect(interactionfind).toBeCalledWith(interaction.id);
  });
  it("should return a new Grant", async () => {
    const { useCase, interactionServiceMock, grantServiceMock } =
      makeConfirmConsentUseCaseTest();

    interactionServiceMock.find.mockReturnValueOnce(
      TE.right(O.some(afterLoginInteraction))
    );
    interactionServiceMock.upsert.mockImplementationOnce((_) => TE.right(_));
    const grantFindBy = grantServiceMock.findBy.mockReturnValueOnce(
      TE.right([])
    );
    grantServiceMock.upsert.mockImplementationOnce((_) => TE.right(grant));

    const actual = await useCase(afterLoginInteraction.id, false)();
    expect(actual).toStrictEqual(E.right(grant));
    expect(grantFindBy).toBeCalledTimes(1);
  });
  it("should reject expired remebered grant", async () => {
    const { useCase, interactionServiceMock, grantServiceMock } =
      makeConfirmConsentUseCaseTest();

    interactionServiceMock.find.mockReturnValueOnce(
      TE.right(O.some(afterLoginInteraction))
    );
    interactionServiceMock.upsert.mockImplementationOnce((_) => TE.right(_));
    const grantFindBy = grantServiceMock.findBy.mockReturnValueOnce(
      TE.right([{ ...grant, expireAt: grant.issuedAt }])
    );
    grantServiceMock.upsert.mockImplementationOnce(TE.right);

    const actual = await useCase(afterLoginInteraction.id, false)();
    // check that the grant is different from the expired one
    expect(actual).not.toStrictEqual(E.right(grant));
    expect(grantFindBy).toBeCalledWith({
      clientId: O.some(afterLoginInteraction.params.client_id),
      identityId: grant.subjects.identityId,
      remember: true,
    });
    expect(grantFindBy).toBeCalledTimes(1);
  });
  it("should return the grant remebered if any", async () => {
    const { useCase, interactionServiceMock, grantServiceMock } =
      makeConfirmConsentUseCaseTest();

    interactionServiceMock.find.mockReturnValueOnce(
      TE.right(O.some(afterLoginInteraction))
    );
    interactionServiceMock.upsert.mockImplementationOnce((_) => TE.right(_));
    const grantFindBy = grantServiceMock.findBy.mockReturnValueOnce(
      TE.right([grant])
    );
    grantServiceMock.upsert.mockImplementationOnce((_) => TE.right(grant));

    const actual = await useCase(afterLoginInteraction.id, false)();
    expect(actual).toStrictEqual(E.right(grant));
    expect(grantFindBy).toBeCalledWith({
      clientId: O.some(afterLoginInteraction.params.client_id),
      identityId: grant.subjects.identityId,
      remember: true,
    });
    expect(grantFindBy).toBeCalledTimes(1);
  });
  it("should return the grant referenced by the given interaction", async () => {
    const { useCase, interactionServiceMock, grantServiceMock } =
      makeConfirmConsentUseCaseTest();

    interactionServiceMock.find.mockReturnValueOnce(
      TE.right(O.some(afterConsentInteraction))
    );
    interactionServiceMock.upsert.mockImplementationOnce((_) => TE.right(_));
    grantServiceMock.upsert.mockImplementationOnce((_) => TE.right(grant));
    grantServiceMock.find.mockImplementationOnce((_0, _1) =>
      TE.right(O.some(grant))
    );

    const actual = await useCase(afterConsentInteraction.id, false)();
    expect(actual).toStrictEqual(E.right(grant));
  });
  it("should save the grant as to remember", async () => {
    const { grantTTL } = config.features.grant;
    const { useCase, interactionServiceMock, grantServiceMock } =
      makeConfirmConsentUseCaseTest({
        ...config.features,
        grant: { enableRememberGrantFeature: true, grantTTL },
      });

    interactionServiceMock.find.mockReturnValueOnce(
      TE.right(O.some(afterLoginInteraction))
    );
    interactionServiceMock.upsert.mockImplementationOnce((_) => TE.right(_));
    grantServiceMock.findBy.mockReturnValueOnce(TE.right([]));
    const grantUpsert = grantServiceMock.upsert.mockImplementationOnce((_) =>
      TE.right(grant)
    );

    const actual = await useCase(afterLoginInteraction.id, true)();
    expect(actual).toStrictEqual(E.right(grant));
    expect(grantUpsert).toBeCalledTimes(1);
    expect(grantUpsert).toBeCalledWith(
      expect.objectContaining({
        remember: true,
      })
    );
  });
  it("should ignore the rememberGrant if the feature is disabled", async () => {
    const { grantTTL } = config.features.grant;
    const { useCase, interactionServiceMock, grantServiceMock } =
      makeConfirmConsentUseCaseTest({
        ...config.features,
        grant: { enableRememberGrantFeature: false, grantTTL },
      });

    interactionServiceMock.find.mockReturnValueOnce(
      TE.right(O.some(afterLoginInteraction))
    );
    interactionServiceMock.upsert.mockImplementationOnce((_) => TE.right(_));
    grantServiceMock.findBy.mockReturnValueOnce(TE.right([]));
    const grantUpsert = grantServiceMock.upsert.mockImplementationOnce((_) =>
      TE.right(grant)
    );

    const actual = await useCase(afterLoginInteraction.id, true)();
    expect(actual).toStrictEqual(E.right(grant));
    expect(grantUpsert).toBeCalledTimes(1);
    expect(grantUpsert).toBeCalledWith(
      expect.objectContaining({
        remember: false,
      })
    );
  });
});
