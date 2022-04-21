import * as t from "io-ts";
import { constVoid, pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as prisma from "@prisma/client";
import { PrismaClient } from "@prisma/client";
import { Logger } from "../../domain/logger";
import { ClientService } from "../../domain/clients/ClientService";
import {
  Client,
  ClientId,
  GrantTypes,
  OrganizationId,
  ResponseTypes,
  ServiceId,
} from "../../domain/clients/types";
import { runAsTE, runAsTEO } from "./utils";
import { MongoDBConfig } from "./types";

const fromRecord = (record: prisma.Client): t.Validation<Client> =>
  pipe(
    E.of(
      (clientId: ClientId) =>
        (organizationId: OrganizationId) =>
        (serviceId: ServiceId) =>
        (grantTypes: GrantTypes) =>
        (responseTypes: ResponseTypes) => ({
          ...record,
          clientId,
          grantTypes,
          organizationId,
          responseTypes,
          serviceId,
        })
    ),
    E.ap(ClientId.decode(record.clientId)),
    E.ap(OrganizationId.decode(record.organizationId)),
    E.ap(ServiceId.decode(record.serviceId)),
    E.ap(GrantTypes.decode(record.grantTypes)),
    E.ap(ResponseTypes.decode(record.responseTypes))
  );

const toRecord = (entity: Client): prisma.Client => ({
  ...entity,
  // TODO: remove this hardcoded id
  id: entity.clientId,
  skipConsent: false,
});

export const makeClientService = (
  config: MongoDBConfig,
  logger: Logger,
  client: PrismaClient = new PrismaClient({
    datasources: { db: { url: config.connectionString.href } },
  })
): ClientService => ({
  find: (id) =>
    runAsTEO(logger)("find", fromRecord, () =>
      client.client.findUnique({ where: { clientId: id } })
    ),
  list: (selector) =>
    runAsTE(logger)("list", E.traverseArray(fromRecord), () =>
      client.client.findMany({
        where: {
          AND: [
            { serviceId: O.toUndefined(selector.serviceId) },
            { organizationId: O.toUndefined(selector.organizationId) },
          ],
        },
      })
    ),
  remove: (id) =>
    runAsTE(logger)(
      "remove",
      (_) => E.right(constVoid()),
      () => client.client.delete({ where: { clientId: id } })
    ),
  upsert: (definition) => {
    const obj = { ...toRecord(definition), id: undefined };
    return runAsTE(logger)("upsert", fromRecord, () =>
      client.client.upsert({
        create: obj,
        update: obj,
        where: { clientId: definition.clientId },
      })
    );
  },
});
