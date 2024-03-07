import { pipe } from "fp-ts/lib/function.js";
import * as O from "fp-ts/lib/Option.js";
import * as RA from "fp-ts/lib/ReadonlyArray.js";
import * as TE from "fp-ts/lib/TaskEither.js";
import { GrantService } from "../domain/grants/GrantService.js";
import { Grant } from "../domain/grants/types.js";
import {
  ConsentResult,
  Interaction,
  LoginResult,
} from "../domain/interactions/types.js";
import { DomainError } from "../domain/types/index.js";

/**
 * Try to retrieve a valid grant given an interaciton
 */
export const findValidGrant =
  (grantService: GrantService) =>
  (interaction: Interaction): TE.TaskEither<DomainError, O.Option<Grant>> => {
    if (ConsentResult.is(interaction.result)) {
      // if the interaction has a grantId then load it
      return pipe(
        grantService.find(
          interaction.result.identityId,
          interaction.result.grantId
        )
      );
    } else if (LoginResult.is(interaction.result)) {
      // if the interaction has not a grant id and has an identity then
      // load a grant given the tuple (identityId, clientId)
      const selector = {
        clientId: O.some(interaction.params.client_id),
        identityId: interaction.result.identityId,
        remember: true,
      };
      return pipe(
        grantService.findBy(selector),
        TE.map(
          RA.findFirst(
            (grant) =>
              grant.scope === interaction.params.scope &&
              grant.expireAt.getTime() >= new Date().getTime()
          )
        )
      );
    } else {
      // otherwise we cannot fetch any grant
      return TE.right(O.none);
    }
  };
