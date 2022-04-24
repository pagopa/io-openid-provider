import * as t from "io-ts";
import * as O from "fp-ts/Option";
import * as TE from "fp-ts/TaskEither";
import * as RA from "fp-ts/ReadonlyArray";
import { flow, pipe } from "fp-ts/lib/function";
import { Identity } from "../identities/types";
import { InteractionId, interactionStep } from "../interactions/types";
import { Grant } from "../grants/types";
import { Client } from "../clients/types";
import { InteractionService } from "../interactions/InteractionService";
import { GrantService } from "../grants/GrantService";
import { IdentityService } from "../identities/IdentityService";
import { Logger } from "../logger";
import { fromTEOtoTE, show } from "../utils";
import { ClientService } from "../clients/ClientService";
import { AuthenticateUseCase } from "./AuthenticateUseCase";

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

export const ProcessResult = t.union([
  LoginResult,
  ConsentResult,
  RequireConsent,
]);
export type ProcessResult = t.TypeOf<typeof ProcessResult>;

export const enum ProcessInteractionUseCaseError {
  invalidInteraction = "Invalid Interaction",
  unauthorized = "Unauthorized",
}
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
      interactionService.find(interactionId),
      fromTEOtoTE,
      TE.mapLeft((_) => ProcessInteractionUseCaseError.invalidInteraction),
      TE.chain((interaction) => {
        if (interactionStep(interaction) === "login") {
          return pipe(
            // run the logic to handle the login
            AuthenticateUseCase(logger, identityService)(accessToken()),
            // create the result
            TE.bimap(
              (_) => ProcessInteractionUseCaseError.unauthorized,
              (identity) => ({ identity, kind: "LoginResult" })
            )
          );
        } else {
          const requireConsent = pipe(
            clientService.find(interaction.params.client_id),
            fromTEOtoTE,
            TE.map(
              (client) =>
                ({
                  client,
                  interactionId: interaction.id,
                  kind: "RequireConsent",
                  // TODO: Compare the required scope with the grant (if any) scope.
                  // The system should ask the diff
                  missingScope: (
                    interaction.params.scope || client.scope
                  ).split(" "),
                } as RequireConsent)
            )
          );
          const maybeGrant = pipe(
            O.fromNullable(interaction.session?.identityId),
            O.fold(
              () => TE.right(O.none),
              (identityId) =>
                // if the interaction has an identity linked, retrieve
                // a "to remember" grant if any.
                pipe(
                  grantService.findBy({
                    clientId: O.some(interaction.params.client_id),
                    identityId,
                    remember: true,
                  }),
                  TE.map(
                    flow(
                      RA.filter(
                        (_) =>
                          _.scope === interaction.params.scope &&
                          _.expireAt.getTime() >= new Date().getTime()
                      ),
                      RA.head
                    )
                  )
                )
            )
          );
          return pipe(
            maybeGrant,
            TE.chain(
              O.fold(
                () => requireConsent,
                (grant) =>
                  TE.right({
                    grant,
                    kind: "ConsentResult",
                  } as ProcessResult)
              )
            ),
            TE.mapLeft((error) => {
              logger.error(
                `Error on ProcessInteractionUseCase: ${show(error)}`,
                error.causedBy
              );
              return ProcessInteractionUseCaseError.invalidInteraction;
            })
          );
        }
      })
    );
