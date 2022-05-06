import * as mock from "jest-mock-extended";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { Logger } from "../../logger";
import { GrantService } from "../../grants/GrantService";
import { InteractionService } from "../../interactions/InteractionService";
import { ConfirmConsentUseCase } from "../ConfirmConsentUseCase";
import { DomainErrorTypes, Seconds } from "../../types";
import {
  afterConsentInteraction,
  afterLoginInteraction,
  interaction,
} from "../../interactions/__tests__/data";
import { grant } from "../../grants/__tests__/data";

const makeConfirmConsentUseCaseTest = () => {
  const grantTTL = 86400 as Seconds;
  const logger = mock.mock<Logger>();
  const interactionServiceMock = mock.mock<InteractionService>();
  const grantServiceMock = mock.mock<GrantService>();
  const useCase = ConfirmConsentUseCase(
    grantTTL,
    logger,
    interactionServiceMock,
    grantServiceMock
  );
  return { logger, interactionServiceMock, grantServiceMock, useCase };
};

describe("ConfirmConsentUseCase", () => {
  it("should return an error if the interaction doesn't exists", async () => {
    const { useCase, interactionServiceMock } = makeConfirmConsentUseCaseTest();

    const interactionfind = interactionServiceMock.find.mockReturnValue(
      TE.right(O.none)
    );
    const actual = await useCase(interaction.id, false)();
    expect(actual).toStrictEqual(E.left(DomainErrorTypes.NOT_FOUND));
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
  it.only("should return the grant referenced by the given interaction", async () => {
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
});
