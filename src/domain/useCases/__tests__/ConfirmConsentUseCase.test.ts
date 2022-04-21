import * as mock from "jest-mock-extended";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { Logger } from "../../logger";
import { GrantService } from "../../grants/GrantService";
import { InteractionService } from "../../interactions/InteractionService";
import { ConfirmConsentUseCase } from "../ConfirmConsentUseCase";
import { DomainErrorTypes } from "../../types";
import {
  afterConsentInteraction,
  afterLoginInteraction,
} from "../../interactions/__tests__/data";
import { grant } from "../../grants/__tests__/data";

const makeConfirmConsentUseCaseTest = () => {
  const logger = mock.mock<Logger>();
  const interactionServiceMock = mock.mock<InteractionService>();
  const grantServiceMock = mock.mock<GrantService>();
  const useCase = ConfirmConsentUseCase(
    logger,
    interactionServiceMock,
    grantServiceMock
  );
  return { logger, interactionServiceMock, grantServiceMock, useCase };
};

describe("ConfirmConsentUseCase", () => {
  it("should return an error if the interaction doesn't exists", async () => {
    const { useCase, interactionServiceMock } = makeConfirmConsentUseCaseTest();

    const actual0 = await useCase(undefined, false)();
    expect(actual0).toStrictEqual(E.left(DomainErrorTypes.GENERIC_ERROR));

    const interactionfind = interactionServiceMock.find.mockReturnValue(
      TE.right(O.none)
    );
    const actual1 = await useCase("doesnt-exist", false)();
    expect(actual1).toStrictEqual(E.left(DomainErrorTypes.NOT_FOUND));
    expect(interactionfind).toBeCalledWith("doesnt-exist");
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
    expect(actual).toStrictEqual(E.right(grant.id));
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
    expect(actual).toStrictEqual(E.right(grant.id));
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
    grantServiceMock.find.mockImplementationOnce((_) =>
      TE.right(O.some(grant))
    );

    const actual = await useCase(afterConsentInteraction.id, false)();
    expect(actual).toStrictEqual(E.right(grant.id));
  });
});