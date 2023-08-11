import * as t from "io-ts";
import { constVoid, pipe } from "fp-ts/lib/function";
import * as E from "fp-ts/Either";
import { Logger } from "../../domain/logger";
import { ClientService } from "../../domain/clients/ClientService";
import {
  Client,
  GrantTypes,
  OrganizationId,
  ResponseTypes,
  ServiceId,
} from "../../domain/clients/types";
import { ClientModel, CosmosClient, RetrievedClient } from "./model/client";
import { makeTE, makeTEOption } from "./utils";

export const fromRecord = (record: RetrievedClient): t.Validation<Client> =>
  pipe(
    E.of(
      (serviceId: ServiceId) =>
        (organizationId: OrganizationId) =>
        (grantTypes: GrantTypes) =>
        (responseTypes: ResponseTypes) => ({
          ...record,
          clientId: {
            organizationId,
            serviceId,
          },
          grantTypes,
          organizationId,
          responseTypes,
        })
    ),
    E.ap(ServiceId.decode(record.id)),
    E.ap(OrganizationId.decode(record.organizationId)),
    E.ap(GrantTypes.decode(record.grantTypes)),
    E.ap(ResponseTypes.decode(record.responseTypes))
  );

export const toRecord = (entity: Client): CosmosClient => ({
  grantTypes: entity.grantTypes,
  id: entity.clientId.serviceId,
  issuedAt: entity.issuedAt,
  name: entity.name,
  organizationId: entity.clientId.organizationId,
  redirectUris: entity.redirectUris.concat(),
  responseTypes: entity.responseTypes,
  scope: entity.scope,
  skipConsent: false,
});

export const makeClientService = (
  logger: Logger,
  clientModel: ClientModel
): ClientService => ({
  find: (id) =>
    makeTEOption(logger)("find", fromRecord, () =>
      clientModel.findClientByServiceIdAndOrganizationdId(
        id.serviceId,
        id.organizationId
      )
    ),
  list: (selector) =>
    makeTE(logger)("list", E.traverseArray(fromRecord), () =>
      clientModel.findAllByQuery(selector.serviceId, selector.organizationId)
    ),
  remove: (id) =>
    makeTE(logger)(
      "remove",
      (_) => E.right(constVoid()),
      () => clientModel.delete(id.serviceId, id.organizationId)
    ),
  upsert: (definition) => {
    const obj = { ...toRecord(definition) };
    return makeTE(logger)("upsert", fromRecord, () => clientModel.upsert(obj));
  },
});
