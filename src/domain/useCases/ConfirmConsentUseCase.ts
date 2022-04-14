import * as crypto from "crypto";
import { flow, pipe } from "fp-ts/lib/function";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { GrantService } from "../grants/GrantService";
import { Grant, GrantId } from "../grants/types";
import { InteractionService } from "../interactions/InteractionService";
import {
  ConsentResult,
  Interaction,
  InteractionId,
  LoginResult,
} from "../interactions/types";
import { Logger } from "../logger";
import { DomainError, DomainErrorTypes, makeDomainError } from "../types";
import { fromTEOtoTE, show } from "../utils";

type ConfirmConsentUseCaseError = DomainErrorTypes;

const loadOrCreateGrant =
  (grantService: GrantService) =>
  (
    interaction: Interaction,
    rememberGrant: boolean
  ): TE.TaskEither<DomainError, Grant> => {
    if (ConsentResult.is(interaction.result)) {
      return pipe(grantService.find(interaction.result.grantId), fromTEOtoTE);
    } else if (LoginResult.is(interaction.result)) {
      return TE.right({
        expireAt: new Date(new Date().getTime() + 1000 * 60 * 60 * 24),
        id: crypto.randomBytes(20).toString("hex") as GrantId,
        issuedAt: new Date(),
        remember: rememberGrant,
        scope: interaction.params.scope,
        subjects: {
          clientId: interaction.params.client_id,
          identityId: interaction.result.identity,
        },
      });
    } else {
      return TE.left(
        makeDomainError("Bad Step", DomainErrorTypes.GENERIC_ERROR)
      );
    }
  };

/**
 * Given a interaction identity, create a new Grant, or fetch the one referenced,
 * and connect it to the interaction. Return the Grant identity.
 */
export const ConfirmConsentUseCase =
  (
    logger: Logger,
    interactionService: InteractionService,
    grantService: GrantService
  ) =>
  (
    interactionId: string | undefined,
    rememberGrant: boolean
  ): TE.TaskEither<ConfirmConsentUseCaseError, GrantId> =>
    pipe(
      TE.fromEither(
        pipe(InteractionId.decode(interactionId), E.mapLeft(makeDomainError))
      ),
      TE.chain(flow(interactionService.find, fromTEOtoTE)),
      TE.chain((interaction) =>
        pipe(
          // Load or Create a grant
          loadOrCreateGrant(grantService)(interaction, rememberGrant),
          // TODO: Add missing scope to the grant
          // update the interaction and the grant
          TE.chain((grant) => {
            const newInteraction = {
              ...interaction,
              result: {
                ...interaction.result,
                grantId: grant.id,
              },
            };
            return pipe(
              interactionService.upsert(newInteraction),
              TE.chain((_) => grantService.upsert(grant))
            );
          })
        )
      ),
      TE.chainFirst((result) =>
        TE.of(logger.info(`ConfirmConsentUseCase ${show(result)}`))
      ),
      TE.bimap(
        (_) => _.kind,
        (_) => _.id
      )
    );
