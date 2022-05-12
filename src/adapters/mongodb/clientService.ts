import * as t from "io-ts";
import { constVoid, pipe } from "fp-ts/lib/function";
import * as E from "fp-ts/Either";
import * as prisma from "@prisma/client";
import { Prisma } from "@prisma/client";
import { Logger } from "../../domain/logger";
import { ClientService } from "../../domain/clients/ClientService";
import {
  Client,
  GrantTypes,
  OrganizationId,
  ResponseTypes,
  ServiceId,
} from "../../domain/clients/types";
import { runAsTE, runAsTEO } from "./utils";

const fromRecord = (record: prisma.Client): t.Validation<Client> =>
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
    E.ap(ServiceId.decode(record.serviceId)),
    E.ap(OrganizationId.decode(record.organizationId)),
    E.ap(GrantTypes.decode(record.grantTypes)),
    E.ap(ResponseTypes.decode(record.responseTypes))
  );

const toRecord = (entity: Client): prisma.Client => ({
  grantTypes: entity.grantTypes,
  issuedAt: entity.issuedAt,
  name: entity.name,
  organizationId: entity.clientId.organizationId,
  redirectUris: entity.redirectUris.concat(),
  responseTypes: entity.responseTypes,
  scope: entity.scope,
  serviceId: entity.clientId.serviceId,
  skipConsent: false,
});

export const makeClientService = <T>(
  logger: Logger,
  client: Prisma.ClientDelegate<T>
): ClientService => ({
  find: (id) =>
    runAsTEO(logger)("find", fromRecord, () =>
      client.findUnique({
        where: {
          organizationId_serviceId: {
            organizationId: id.organizationId,
            serviceId: id.serviceId,
          },
        },
      })
    ),
  remove: (id) =>
    runAsTE(logger)(
      "remove",
      (_) => E.right(constVoid()),
      () =>
        client.delete({
          where: {
            organizationId_serviceId: {
              organizationId: id.organizationId,
              serviceId: id.serviceId,
            },
          },
        })
    ),
  upsert: (definition) => {
    const obj = { ...toRecord(definition) };
    return runAsTE(logger)("upsert", fromRecord, () =>
      client.upsert({
        create: obj,
        update: { ...{ ...obj, serviceId: undefined } },
        where: {
          organizationId_serviceId: {
            organizationId: definition.clientId.organizationId,
            serviceId: definition.clientId.serviceId,
          },
        },
      })
    );
  },
});
