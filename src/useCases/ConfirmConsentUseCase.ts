import * as crypto from "crypto";
import { pipe } from "fp-ts/lib/function.js";
import * as O from "fp-ts/lib/Option.js";
import * as TE from "fp-ts/lib/TaskEither.js";
import { GrantService } from "../domain/grants/GrantService.js";
import { Grant, GrantId } from "../domain/grants/types.js";
import { InteractionService } from "../domain/interactions/InteractionService.js";
import { Interaction, InteractionId } from "../domain/interactions/types.js";
import { Logger } from "../domain/logger/index.js";
import {
  DomainError,
  makeDomainError,
  Seconds,
} from "../domain/types/index.js";
import { fromTEOtoTE, show } from "../domain/utils.js";
import { findValidGrant } from "./utils.js";
import { Features } from "./index.js";

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
    logger: Logger,
    features: Features,
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
          TE.map(
            O.alt(() => {
              const { grantTTL, enableRememberGrantFeature } = features.grant;
              // Remember grant if the feature is enabled
              const remember = enableRememberGrantFeature && rememberGrant;
              return makeGrant(interaction, remember, grantTTL);
            })
          ),
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
