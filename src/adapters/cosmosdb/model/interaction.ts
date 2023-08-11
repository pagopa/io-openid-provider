import * as t from "io-ts";
import * as tt from "io-ts-types";
import { Timestamp } from "@pagopa/io-functions-commons/dist/generated/definitions/Timestamp";
import { Container } from "@azure/cosmos";
import { Option } from "fp-ts/lib/Option";

import {
  CosmosErrors,
  CosmosResource,
  CosmosdbModel,
  toCosmosErrorResponse,
} from "@pagopa/io-functions-commons/dist/src/utils/cosmosdb_model";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { TaskEither } from "fp-ts/lib/TaskEither";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/function";
import { RequestParams } from "src/domain/interactions/types";

export const INTERACTION_COLLECTION_NAME = "interaction";
const INTERACTION_MODEL_PK_FIELD = "id";

const InteractionBaseR = t.interface({
  expireAt: Timestamp,
  id: NonEmptyString,
  issuedAt: Timestamp,
  params: RequestParams,
  payload: tt.JsonRecord,
});
const InteractionBaseO = t.partial({
  error: t.string,
  grantId: t.string,
  identityId: t.string,
});
const CosmosInteraction = t.intersection(
  [InteractionBaseR, InteractionBaseO],
  "CosmosInteraction"
);
export type CosmosInteraction = t.TypeOf<typeof CosmosInteraction>;

export const RetrievedInteraction = t.intersection([
  CosmosInteraction,
  CosmosResource,
]);
export type RetrievedInteraction = t.TypeOf<typeof RetrievedInteraction>;

export class InteractionModel extends CosmosdbModel<
  CosmosInteraction,
  CosmosInteraction,
  RetrievedInteraction,
  typeof INTERACTION_MODEL_PK_FIELD
> {
  /**
   * Creates a new Interaction model
   *
   * @param container the Cosmos container Interaction
   */
  constructor(container: Container) {
    super(container, CosmosInteraction, RetrievedInteraction);
  }

  /**
   * Returns the Interaction object associated to the interactionId
   *
   * @param interactionId The Id of the interaction
   */
  public findOne(
    interactionId: NonEmptyString
  ): TaskEither<CosmosErrors, Option<RetrievedInteraction>> {
    return this.findOneByQuery({
      parameters: [
        {
          name: "@interactionId",
          value: interactionId,
        },
      ],
      query: `SELECT * FROM n WHERE n.${INTERACTION_MODEL_PK_FIELD} = @interactionId`,
    });
  }

  /**
   * Delete the Interaction associated to the interactionId
   *
   * @param interactionId The Id of the interaction
   */
  public delete(
    interactionId: NonEmptyString
  ): TaskEither<CosmosErrors, string> {
    return pipe(
      TE.tryCatch(
        () => this.container.item(interactionId).delete(),
        toCosmosErrorResponse
      ),
      TE.map((_) => _.item.id)
    );
  }
}
