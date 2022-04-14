import { pipe } from "fp-ts/function";
import * as t from "io-ts";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { Client } from "../clients/types";
import { Interaction, InteractionId, LoginResult } from "../interactions/types";
import { Grant } from "../grants/types";
import { Logger } from "../logger";
import { ClientService } from "../clients/ClientService";
import { fromTEOtoTE, show } from "../utils";
import { GrantService } from "../grants/GrantService";

export const RenderData = t.type({
  client: Client,
  interactionId: InteractionId,
  kind: t.literal("RenderData"),
  missingScope: t.array(t.string),
});
export type RenderData = t.TypeOf<typeof RenderData>;

const makeRenderData =
  (interaction: Interaction) =>
  (client: Client): RenderData => ({
    client,
    interactionId: interaction.id,
    kind: "RenderData",
    // TODO: Compare the required scope with the grant (if any) scope.
    // The system should ask the diff
    missingScope: interaction.params.scope.split(" "),
  });

const loadRememberedGrant =
  (logger: Logger, grantService: GrantService) =>
  (interaction: Interaction) => {
    if (LoginResult.is(interaction.result)) {
      logger.debug(`loadRememberGrant - findBySubjects ${show(interaction)}`);
      return pipe(
        grantService.findBySubjects({
          clientId: interaction.params.client_id,
          identityId: interaction.result.identity,
        })
      );
    } else {
      logger.debug(`loadRememberGrant ${show(interaction)}`);
      return TE.right(O.none);
    }
  };

/**
 * Check if exists any grant to return for the given interaction,
 * othwerwise returns a RenderData instance with all the information
 * about the cosent
 */
export const ProcessConsentUseCase =
  (logger: Logger, clientService: ClientService, grantService: GrantService) =>
  (
    interaction: Interaction
  ): TE.TaskEither<string, E.Either<RenderData, Grant>> => {
    const client = pipe(
      clientService.find(interaction.params.client_id),
      fromTEOtoTE
    );
    return pipe(
      loadRememberedGrant(logger, grantService)(interaction),
      TE.chain(
        O.fold(
          () =>
            pipe(client, TE.map(makeRenderData(interaction)), TE.map(E.left)),
          (grant) => TE.right(E.right(grant))
        )
      ),
      TE.chainFirst((result) =>
        TE.of(logger.info(`ProcessConsentUseCase ${show(result)}`))
      ),
      TE.mapLeft((_) => "error")
    );
  };
