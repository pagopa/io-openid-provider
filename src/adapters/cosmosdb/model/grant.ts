import * as t from "io-ts";
import { Timestamp } from "@pagopa/io-functions-commons/dist/generated/definitions/Timestamp";
import { Container } from "@azure/cosmos";
import { Option } from "fp-ts/lib/Option";

import {
  CosmosErrors,
  CosmosResource,
  toCosmosErrorResponse,
} from "@pagopa/io-functions-commons/dist/src/utils/cosmosdb_model";
import { asyncIterableToArray } from "@pagopa/io-functions-commons/dist/src/utils/async";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { TaskEither } from "fp-ts/lib/TaskEither";
import * as TE from "fp-ts/TaskEither";
import * as O from "fp-ts/Option";
import * as RA from "fp-ts/ReadonlyArray";
import { pipe } from "fp-ts/lib/function";
import {
  CosmosdbModelTTL,
  Ttl,
} from "@pagopa/io-functions-commons/dist/src/utils/cosmosdb_model_ttl";
import { IdentityId } from "../../../domain/identities/types";

export const GRANT_COLLECTION_NAME = "Grant";
const GRANT_MODEL_PK_FIELD = "id";
const GRANT_PARTITION_KEY_FIELD = "identityId";

const GrantBaseR = t.interface({
  clientId: t.string,
  expireAt: Timestamp,
  id: NonEmptyString,
  identityId: IdentityId,
  issuedAt: Timestamp,
  remember: t.boolean,
  scope: t.string,
});
const GrantBaseO = t.partial({
  ttl: Ttl,
});
const CosmosGrant = t.intersection(
  [GrantBaseR, GrantBaseO],
  "CosmosInteraction"
);
export type CosmosGrant = t.TypeOf<typeof CosmosGrant>;

export const RetrievedGrant = t.intersection([CosmosGrant, CosmosResource]);
export type RetrievedGrant = t.TypeOf<typeof RetrievedGrant>;

export class GrantModel extends CosmosdbModelTTL<
  CosmosGrant,
  CosmosGrant,
  RetrievedGrant,
  typeof GRANT_MODEL_PK_FIELD,
  typeof GRANT_PARTITION_KEY_FIELD
> {
  /**
   * Creates a new Grant model
   *
   * @param container the Cosmos container Grant
   */
  constructor(container: Container) {
    super(container, CosmosGrant, RetrievedGrant);
  }

  /**
   * Returns the Grant object associated to the grantId and identityId.
   *
   * @param grantId The Id of the grant
   * @param identityId The identityId of the grant
   */
  public findOne(
    grantId: NonEmptyString,
    identityId: IdentityId
  ): TaskEither<CosmosErrors, Option<RetrievedGrant>> {
    return this.findOneByQuery({
      parameters: [
        {
          name: "@grantId",
          value: grantId,
        },
        {
          name: "@identityId",
          value: identityId,
        },
      ],
      query: `SELECT * FROM n WHERE n.${GRANT_MODEL_PK_FIELD} = @grantId AND n.identityId = @identityId`,
    });
  }

  /**
   * Returns all filtered Grant objects
   *
   * @param identityId The identityId to filter the grants
   * @param remember The organizationId to filter the grants
   * @param maybeClientId The optional clientId to filter the grants
   */
  public findAllByQuery(
    identityId: IdentityId,
    remember: boolean,
    maybeClientId?: string
  ): TaskEither<CosmosErrors, ReadonlyArray<RetrievedGrant>> {
    const commonQuerySpec = {
      parameters: [
        {
          name: "@identityId",
          value: identityId,
        },
        {
          name: "@remember",
          value: remember,
        },
      ],
      query: `SELECT * FROM n WHERE n.identityId = @identityId AND n.remember = @remember`,
    };
    const emptyParameter = {
      condition: "",
      param: [],
    };
    return pipe(
      TE.of({
        clientIdParams: pipe(
          O.fromNullable(maybeClientId),
          O.foldW(
            () => emptyParameter,
            (clientId) => ({
              condition: ` AND n.clientId = @clientId`,
              param: [{ name: "@clientId", value: clientId }],
            })
          )
        ),
      }),
      TE.mapLeft(toCosmosErrorResponse),
      TE.map(({ clientIdParams }) => ({
        parameters: [...commonQuerySpec.parameters, ...clientIdParams.param],
        query: `${commonQuerySpec.query}${clientIdParams.condition}`,
      })),
      TE.chain((querySpec) =>
        TE.tryCatch(
          () => asyncIterableToArray(this.getQueryIterator(querySpec)),
          toCosmosErrorResponse
        )
      ),
      TE.map(RA.flatten),
      TE.map(RA.rights)
    );
  }

  /**
   * Delete the Grant associated to the grantId and identityId
   *
   * @param grantId The Id of the grant
   * @param identityId The identityId of the grant
   */
  public delete(
    grantId: NonEmptyString,
    identityId: IdentityId
  ): TaskEither<CosmosErrors, string> {
    return pipe(
      TE.tryCatch(
        () => this.container.item(grantId, identityId).delete(),
        toCosmosErrorResponse
      ),
      TE.map((_) => _.item.id)
    );
  }
}
