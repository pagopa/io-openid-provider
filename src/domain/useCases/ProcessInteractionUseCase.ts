import * as t from "io-ts";
import * as O from "fp-ts/Option";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/function";
import { Identity } from "../identities/types";
import { Interaction, InteractionId } from "../interactions/types";
import { Grant } from "../grants/types";
import { Client } from "../clients/types";
import { InteractionService } from "../interactions/InteractionService";
import { GrantService } from "../grants/GrantService";
import { IdentityService } from "../identities/IdentityService";
import { Logger } from "../logger";
import { fromTEOtoTE, show } from "../utils";
import { ClientService } from "../clients/ClientService";
import { DomainError, DomainErrorTypes, makeDomainError } from "../types";
import { AuthenticateUseCase } from "./AuthenticateUseCase";
import { findValidGrant } from "./utils";

export const LoginResult = t.type({
  identity: Identity,
  kind: t.literal("LoginResult"),
});
export type LoginResult = t.TypeOf<typeof LoginResult>;

export const ConsentResult = t.type({
  grant: Grant,
  kind: t.literal("ConsentResult"),
});
export type ConsentResult = t.TypeOf<typeof ConsentResult>;

export const RequireConsent = t.type({
  client: Client,
  interactionId: InteractionId,
  kind: t.literal("RequireConsent"),
  missingScope: t.array(t.string),
});
export type RequireConsent = t.TypeOf<typeof RequireConsent>;

const makeRequireConsent = (
  interaction: Interaction,
  client: Client
): ProcessResult => ({
  client,
  interactionId: interaction.id,
  kind: "RequireConsent",
  // TODO: Compare the required scope with the grant (if any) scope.
  // The system should ask the diff
  missingScope: (interaction.params.scope || client.scope).split(" "),
});

export const ProcessResult = t.union([
  LoginResult,
  ConsentResult,
  RequireConsent,
]);
export type ProcessResult = t.TypeOf<typeof ProcessResult>;

export type ProcessInteractionUseCaseError = DomainError;

/**
 * Given an interactionId process it.
 * If there is no identity linked to this interaction run the authentication, otherwise
 * find a valid grant, if none is found then return the information to show to the user
 * about this consent
 */
export const ProcessInteractionUseCase =
  (
    logger: Logger,
    identityService: IdentityService,
    interactionService: InteractionService,
    clientService: ClientService,
    grantService: GrantService
  ) =>
  (
    interactionId: InteractionId,
    accessToken: () => string | undefined
  ): TE.TaskEither<ProcessInteractionUseCaseError, ProcessResult> =>
    pipe(
      // fetch the interaction
      pipe(interactionService.find(interactionId), fromTEOtoTE),
      TE.chain((interaction) => {
        // if the interaction has no result then start from the authentication
        if (interaction.result === undefined) {
          return pipe(
            // run the logic to handle the login
            AuthenticateUseCase(logger, identityService)(accessToken()),
            // create the result
            TE.map((identity) => ({ identity, kind: "LoginResult" }))
          );
        } else {
          return pipe(
            // find a valid grant so we can return it skipping the require consent step
            findValidGrant(grantService)(interaction),
            TE.chain(
              O.fold(
                () =>
                  // grant was not found, so fetch information required to compose the consent information
                  pipe(
                    clientService.find(interaction.params.client_id),
                    TE.chain(
                      O.fold(
                        () =>
                          TE.left(
                            makeDomainError(
                              "Client not found",
                              DomainErrorTypes.NOT_FOUND
                            )
                          ),
                        (client) =>
                          TE.right(makeRequireConsent(interaction, client))
                      )
                    )
                  ),
                (grant) =>
                  TE.right({
                    grant,
                    kind: "ConsentResult",
                  } as ConsentResult)
              )
            ),
            TE.mapLeft((error) => {
              logger.error(
                `Error on ProcessInteractionUseCase: ${show(error)}`,
                error.causedBy
              );
              return error;
            })
          );
        }
      })
    );
