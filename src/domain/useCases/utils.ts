import { pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/Option";
import * as RA from "fp-ts/ReadonlyArray";
import * as TE from "fp-ts/TaskEither";
import { GrantService } from "../grants/GrantService";
import { Grant } from "../grants/types";
import { ConsentResult, Interaction, LoginResult } from "../interactions/types";
import { DomainError } from "../types";

/**
 * Try to retrieve a valid grant given an interaciton
 */
export const findValidGrant =
  (grantService: GrantService) =>
  (interaction: Interaction): TE.TaskEither<DomainError, O.Option<Grant>> => {
    if (ConsentResult.is(interaction.result)) {
      // if the interaction has a grantId then load the grant by id
      return pipe(grantService.find(interaction.result.grantId));
    } else if (LoginResult.is(interaction.result)) {
      // if the interaction has not a grant id and has an identity then
      // load a grant given the tuple (identityId, clientId)
      const selector = {
        clientId: O.some(interaction.params.client_id),
        identityId: interaction.result.identity,
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
