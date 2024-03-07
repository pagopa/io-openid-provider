import * as t from "io-ts";
import { constVoid, pipe } from "fp-ts/lib/function.js";
import * as E from "fp-ts/lib/Either.js";
import { Logger } from "../../domain/logger/index.js";
import { ClientService } from "../../domain/clients/ClientService.js";
import { Client, ServiceId } from "../../domain/clients/types.js";
import { ClientModel, CosmosClient, RetrievedClient } from "./model/client.js";
import { makeTE, makeTEOption } from "./utils.js";

export const fromRecord = (record: RetrievedClient): t.Validation<Client> =>
  pipe(
    E.of((serviceId: ServiceId) => ({
      ...record,
      clientId: {
        organizationId: record.organizationId,
        serviceId,
      },
    })),
    E.ap(ServiceId.decode(record.id))
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
      () => E.right(constVoid()),
      () => clientModel.delete(id.serviceId, id.organizationId)
    ),
  upsert: (definition) => {
    const obj = { ...toRecord(definition) };
    return makeTE(logger)("upsert", fromRecord, () => clientModel.upsert(obj));
  },
});
