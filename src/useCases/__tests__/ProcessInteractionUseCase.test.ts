import * as mock from "jest-mock-extended";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { Logger } from "../../domain/logger";
import { GrantService } from "../../domain/grants/GrantService";
import { ClientService } from "../../domain/clients/ClientService";
import { ProcessInteractionUseCase } from "../ProcessInteractionUseCase";
import {
  afterLoginInteraction,
  interaction,
} from "../../domain/interactions/__tests__/data";
import { identity } from "../../domain/identities/__tests__/data";
import { client } from "../../domain/clients/__tests__/data";
import { grant } from "../../domain/grants/__tests__/data";
import { IdentityService } from "../../domain/identities/IdentityService";
import { InteractionService } from "../../domain/interactions/InteractionService";
import { makeNotFoundError } from "../../domain/types";

const makeProcessInteractionUseCaseTest = () => {
  const logger = mock.mock<Logger>();
  const interactionServiceMock = mock.mock<InteractionService>();
  const identityServiceMock = mock.mock<IdentityService>();
  const clientServiceMock = mock.mock<ClientService>();
  const grantServiceMock = mock.mock<GrantService>();
  const useCase = ProcessInteractionUseCase(
    logger,
    identityServiceMock,
    interactionServiceMock,
    clientServiceMock,
    grantServiceMock
  );
  return {
    logger,
    identityServiceMock,
    interactionServiceMock,
    clientServiceMock,
    grantServiceMock,
    useCase,
  };
};

describe("ProcessInteractionUseCase", () => {
  it("should return error if the client doesn't exists", async () => {
    const {
      useCase,
      clientServiceMock,
      grantServiceMock,
      interactionServiceMock,
    } = makeProcessInteractionUseCaseTest();

    const interactionFind = interactionServiceMock.find.mockReturnValue(
      TE.right(O.some(afterLoginInteraction))
    );
    const clientFind = clientServiceMock.find.mockReturnValueOnce(
      TE.right(O.none)
    );
    grantServiceMock.findBy.mockReturnValueOnce(TE.right([]));

    const actual = await useCase(afterLoginInteraction.id, () => "")();
    const expected = E.left(makeNotFoundError("Client not found"));
    expect(actual).toStrictEqual(expected);
    expect(interactionFind).toBeCalledWith(afterLoginInteraction.id);
    expect(interactionFind).toBeCalledTimes(1);
    expect(clientFind).toBeCalledWith(client.clientId);
    expect(clientFind).toBeCalledTimes(1);
  });
  it("should try authentication if the interaction has no identity", async () => {
    const { useCase, interactionServiceMock, identityServiceMock } =
      makeProcessInteractionUseCaseTest();

    interactionServiceMock.find.mockReturnValue(TE.right(O.some(interaction)));
    identityServiceMock.authenticate.mockReturnValue(TE.right(identity));

    const actual = await useCase(interaction.id, () => "")();
    const expected = E.right({ identity: identity, kind: "LoginResult" });
    expect(actual).toStrictEqual(expected);
  });
  it("should return the information about the consent", async () => {
    const {
      useCase,
      clientServiceMock,
      grantServiceMock,
      interactionServiceMock,
    } = makeProcessInteractionUseCaseTest();

    interactionServiceMock.find.mockReturnValue(
      TE.right(O.some(afterLoginInteraction))
    );
    const clientFind = clientServiceMock.find.mockReturnValueOnce(
      TE.right(O.some(client))
    );
    const grantList = grantServiceMock.findBy.mockReturnValueOnce(TE.right([]));

    const actual = await useCase(afterLoginInteraction.id, () => "")();
    const expected = E.right({
      client: client,
      interactionId: interaction.id,
      kind: "CollectConsent",
      missingScope: interaction.params.scope?.split(" "),
    });
    expect(actual).toStrictEqual(expected);
    expect(clientFind).toBeCalledTimes(1);
    expect(grantList).toBeCalledTimes(1);
  });
  it("should reject invalid remembered grant", async () => {
    const {
      useCase,
      clientServiceMock,
      grantServiceMock,
      interactionServiceMock,
    } = makeProcessInteractionUseCaseTest();

    interactionServiceMock.find.mockReturnValue(
      TE.right(O.some(afterLoginInteraction))
    );
    const clientFind = clientServiceMock.find.mockReturnValueOnce(
      TE.right(O.some(client))
    );
    const grantList = grantServiceMock.findBy.mockReturnValueOnce(
      TE.right([{ ...grant, expireAt: grant.issuedAt }])
    );

    const actual = await useCase(afterLoginInteraction.id, () => "")();
    const expected = E.right({
      client: client,
      interactionId: interaction.id,
      kind: "CollectConsent",
      missingScope: interaction.params.scope?.split(" "),
    });
    expect(actual).toStrictEqual(expected);
    expect(clientFind).toBeCalledTimes(1);
    expect(grantList).toBeCalledWith({
      clientId: O.some(client.clientId),
      identityId: grant.subjects.identityId,
      remember: true,
    });
    expect(grantList).toBeCalledTimes(1);
  });
  it("should return the grant remembered if any", async () => {
    const {
      useCase,
      clientServiceMock,
      grantServiceMock,
      interactionServiceMock,
    } = makeProcessInteractionUseCaseTest();

    interactionServiceMock.find.mockReturnValue(
      TE.right(O.some(afterLoginInteraction))
    );
    const clientFind = clientServiceMock.find.mockReturnValueOnce(
      TE.right(O.some(client))
    );
    const grantList = grantServiceMock.findBy.mockReturnValueOnce(
      TE.right([grant])
    );

    const actual = await useCase(afterLoginInteraction.id, () => "")();
    const expected = E.right({ grant: grant, kind: "ConsentResult" });
    expect(actual).toStrictEqual(expected);
    expect(clientFind).toBeCalledTimes(0);
    expect(grantList).toBeCalledWith({
      clientId: O.some(client.clientId),
      identityId: grant.subjects.identityId,
      remember: true,
    });
    expect(grantList).toBeCalledTimes(1);
  });
});
