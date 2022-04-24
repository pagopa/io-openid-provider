import * as crypto from "crypto";
import { pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/Option";
import * as TE from "fp-ts/TaskEither";
import { GrantService } from "../grants/GrantService";
import { Grant, GrantId } from "../grants/types";
import { InteractionService } from "../interactions/InteractionService";
import { Interaction, InteractionId } from "../interactions/types";
import { Logger } from "../logger";
import { DomainErrorTypes, makeDomainError, Seconds } from "../types";
import { fromTEOtoTE, show } from "../utils";
import { findValidGrant } from "./utils";

type ConfirmConsentUseCaseError = DomainErrorTypes;

const makeGrant = (
  interaction: Interaction,
  remember: boolean,
  grantTTL: Seconds
): O.Option<Grant> =>
  pipe(
    O.fromNullable(interaction.session?.identityId),
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
    interactionId: InteractionId, // TODO: try to use InteractionId
    rememberGrant: boolean
  ): TE.TaskEither<ConfirmConsentUseCaseError, GrantId> =>
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
              () => TE.left(makeDomainError("Internal Error")),
              (grant) => {
                const newInteraction = {
                  ...interaction,
                  result: {
                    ...interaction.result,
                    grantId: grant.id,
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
          return err.kind;
        },
        (res) => {
          logger.debug(`ConfirmConsentUseCase ${show(res)}`);
          return res.id;
        }
      )
    );
