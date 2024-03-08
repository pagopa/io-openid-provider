import * as t from "io-ts";
import * as O from "fp-ts/lib/Option.js";
import * as TE from "fp-ts/lib/TaskEither.js";
import { pipe } from "fp-ts/lib/function.js";
import { Identity } from "../domain/identities/types.js";
import { Interaction, InteractionId } from "../domain/interactions/types.js";
import { Grant } from "../domain/grants/types.js";
import { Client } from "../domain/clients/types.js";
import { InteractionService } from "../domain/interactions/InteractionService.js";
import { GrantService } from "../domain/grants/GrantService.js";
import { IdentityService } from "../domain/identities/IdentityService.js";
import { Logger } from "../domain/logger/index.js";
import { fromTEOtoTE, show } from "../domain/utils.js";
import { ClientService } from "../domain/clients/ClientService.js";
import {
  DomainError,
  DomainErrorTypes,
  makeDomainError,
} from "../domain/types/index.js";
import { AuthenticateUseCase } from "./AuthenticateUseCase.js";
import { findValidGrant } from "./utils.js";
import { Features } from "./index.js";

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

export const CollectConsent = t.type({
  allowRemembering: t.boolean,
  client: Client,
  interactionId: InteractionId,
  kind: t.literal("CollectConsent"),
  missingScope: t.array(t.string),
});
export type CollectConsent = t.TypeOf<typeof CollectConsent>;

const makeCollectConsent = (
  allowRemembering: boolean,
  interaction: Interaction,
  client: Client
): ProcessResult => ({
  allowRemembering,
  client,
  interactionId: interaction.id,
  kind: "CollectConsent",
  // TODO: Compare the required scope with the grant (if any) scope.
  // The system should ask the diff
  missingScope: (interaction.params.scope || client.scope).split(" "),
});

export const ProcessResult = t.union([
  LoginResult,
  ConsentResult,
  CollectConsent,
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
    features: Features,
    identityService: IdentityService,
    interactionService: InteractionService,
    clientService: ClientService,
    grantService: GrantService
    // eslint-disable-next-line max-params
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
                        (client) => {
                          const allowRemembering =
                            features.grant.enableRememberGrantFeature;
                          return TE.right(
                            makeCollectConsent(
                              allowRemembering,
                              interaction,
                              client
                            )
                          );
                        }
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
export type ProcessInteractionUseCase = ReturnType<
  typeof ProcessInteractionUseCase
>;
