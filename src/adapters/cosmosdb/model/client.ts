import * as t from "io-ts";
import { Timestamp } from "@pagopa/io-functions-commons/dist/generated/definitions/Timestamp";
import { Container } from "@azure/cosmos";
import { Option } from "fp-ts/lib/Option";

import {
  CosmosErrors,
  CosmosResource,
  CosmosdbModel,
  toCosmosErrorResponse,
} from "@pagopa/io-functions-commons/dist/src/utils/cosmosdb_model";
import { asyncIterableToArray } from "@pagopa/io-functions-commons/dist/src/utils/async";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import {
  GrantTypes,
  OrganizationId,
  ResponseTypes,
} from "src/domain/clients/types";
import { TaskEither } from "fp-ts/lib/TaskEither";
import * as TE from "fp-ts/TaskEither";
import * as O from "fp-ts/Option";
import * as RA from "fp-ts/ReadonlyArray";
import { pipe } from "fp-ts/lib/function";

export const CLIENT_COLLECTION_NAME = "client";
const CLIENT_MODEL_PK_FIELD = "id";
const CLIENT_PARTITION_KEY_FIELD = "organizationId";

export const CosmosClient = t.interface({
  grantTypes: GrantTypes,
  id: NonEmptyString, // serviceId
  issuedAt: Timestamp,
  name: t.string,
  organizationId: OrganizationId,
  redirectUris: t.readonlyArray(t.string),
  responseTypes: ResponseTypes,
  scope: t.string,
  skipConsent: t.boolean,
});
export type CosmosClient = t.TypeOf<typeof CosmosClient>;

export const RetrievedClient = t.intersection([CosmosClient, CosmosResource]);
export type RetrievedClient = t.TypeOf<typeof RetrievedClient>;

export class ClientModel extends CosmosdbModel<
  CosmosClient,
  CosmosClient,
  RetrievedClient,
  typeof CLIENT_PARTITION_KEY_FIELD
> {
  /**
   * Creates a new Client model
   *
   * @param container the Cosmos container client
   */
  constructor(container: Container) {
    super(container, CosmosClient, RetrievedClient);
  }

  /**
   * Returns the Client object associated to the serviceId and organizationId.
   *
   * @param serviceId The Id of the client
   * @param organizationId The organizationId of the client
   */
  public findClientByServiceIdAndOrganizationdId(
    serviceId: NonEmptyString,
    organizationId: OrganizationId
  ): TaskEither<CosmosErrors, Option<RetrievedClient>> {
    return this.findOneByQuery({
      parameters: [
        {
          name: "@serviceId",
          value: serviceId,
        },
        {
          name: "@organizationId",
          value: organizationId,
        },
      ],
      query: `SELECT * FROM n WHERE n.${CLIENT_MODEL_PK_FIELD} = @serviceId AND n.organizationId = @organizationId`,
    });
  }

  /**
   * Returns all Client objects associated to the serviceId and organizationId.
   *
   * @param maybeServiceId The serviceId to filter the clients
   * @param maybeOrganizationId The organizationId to filter the clients
   */
  public findAllByQuery(
    maybeServiceId: Option<NonEmptyString>,
    maybeOrganizationId: Option<OrganizationId>
  ): TaskEither<CosmosErrors, ReadonlyArray<RetrievedClient>> {
    const commonQuerySpec = {
      parameters: [],
      query: `SELECT * FROM m`,
    };
    const emptyParameter = {
      condition: "",
      param: [],
    };
    return pipe(
      TE.of({
        organizationIdParams: pipe(
          maybeOrganizationId,
          O.foldW(
            () => emptyParameter,
            (organizationId) => ({
              condition: ` AND n.organizationId = @organizationId`,
              param: [{ name: "@organizationId", value: organizationId }],
            })
          )
        ),
        serviceIdParams: pipe(
          maybeServiceId,
          O.foldW(
            () => emptyParameter,
            (serviceId) => ({
              condition: ` AND n.${CLIENT_MODEL_PK_FIELD} = @serviceId`,
              param: [{ name: "@serviceId", value: serviceId }],
            })
          )
        ),
      }),
      TE.mapLeft(toCosmosErrorResponse),
      TE.map(({ serviceIdParams, organizationIdParams }) => ({
        parameters: [
          ...commonQuerySpec.parameters,
          ...serviceIdParams.param,
          ...organizationIdParams.param,
        ],
        query: `${commonQuerySpec.query}${serviceIdParams.condition}${organizationIdParams.condition}`,
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
   * Delete the Client associated to the serviceId and organizationId
   *
   * @param serviceId The Id of the client
   * @param organizationId The organizationId of the client
   */
  public delete(
    serviceId: NonEmptyString,
    organizationId: OrganizationId
  ): TaskEither<CosmosErrors, string> {
    return pipe(
      TE.tryCatch(
        () => this.container.item(serviceId, organizationId).delete(),
        toCosmosErrorResponse
      ),
      TE.map((_) => _.item.id)
    );
  }
}
