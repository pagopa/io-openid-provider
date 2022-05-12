import * as crypto from "crypto";
import { pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/Option";
import * as TE from "fp-ts/TaskEither";
import { GrantService } from "../domain/grants/GrantService";
import { Grant, GrantId } from "../domain/grants/types";
import { InteractionService } from "../domain/interactions/InteractionService";
import { Interaction, InteractionId } from "../domain/interactions/types";
import { Logger } from "../domain/logger";
import { DomainError, makeDomainError, Seconds } from "../domain/types";
import { fromTEOtoTE, show } from "../domain/utils";
import { findValidGrant } from "./utils";

type ConfirmConsentUseCaseError = DomainError;

const makeGrant = (
  interaction: Interaction,
  remember: boolean,
  grantTTL: Seconds
): O.Option<Grant> =>
  pipe(
    O.fromNullable(
      interaction.result && "identityId" in interaction.result
        ? interaction.result.identityId
        : null
    ),
    O.map((identityId) => ({
      expireAt: new Date(new Date().getTime() + 1000 * grantTTL),
      id: crypto.randomUUID() as GrantId,
      issuedAt: new Date(),
      remember,
      scope: interaction.params.scope,
      subjects: {
        clientId: interaction.params.client_id,
        identityId,
      },
    }))
  );

/**
 * Given a interaction identity, create a new Grant, or fetch the one referenced,
 * and connect it to the interaction. Return the Grant identity.
 */
export const ConfirmConsentUseCase =
  (
    grantTTL: Seconds,
    logger: Logger,
    interactionService: InteractionService,
    grantService: GrantService
  ) =>
  (
    interactionId: InteractionId,
    rememberGrant: boolean
  ): TE.TaskEither<ConfirmConsentUseCaseError, Grant> =>
    pipe(
      // fetch the interaction
      pipe(interactionService.find(interactionId), fromTEOtoTE),
      TE.chain((interaction) =>
        pipe(
          // find a valid grant
          findValidGrant(grantService)(interaction),
          // if no grant was found then create a new one
          TE.map(O.alt(() => makeGrant(interaction, rememberGrant, grantTTL))),
          // update the interaction and the grant instance persisting them
          TE.chain(
            O.fold(
              () => {
                logger.error("Unable to create a valid grant");
                return TE.left(
                  makeDomainError("Unable to create a valid grant")
                );
              },
              (grant) => {
                const newInteraction = {
                  ...interaction,
                  result: {
                    grantId: grant.id,
                    identityId: grant.subjects.identityId,
                  },
                };
                return pipe(
                  interactionService.upsert(newInteraction),
                  TE.apSecond(grantService.upsert(grant))
                );
              }
            )
          )
        )
      ),
      TE.bimap(
        (err) => {
          logger.error(`Error on ConfirmConsentUseCase ${show(err)}`, err);
          return err;
        },
        (res) => {
          logger.debug(`ConfirmConsentUseCase ${show(res)}`);
          return res;
        }
      )
    );
export type ConfirmConsentUseCase = ReturnType<typeof ConfirmConsentUseCase>;