/* eslint-disable sort-keys */
import * as prisma from "@prisma/client";
import { Prisma, PrismaClient } from "@prisma/client";
import { constVoid, flow, pipe } from "fp-ts/function";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { Logger } from "src/logger";
import {
  Client,
  ClientId,
  ClientSelector,
  DomainErrorTypes,
  OrganizationId,
  ResponseType,
  ServiceId,
} from "../../core/domain";
import { ClientRepository } from "../../core/repositories/ClientRepository";
import { PostgresConfig } from "./domain";

const fromRecord = (record: prisma.Client): Client => ({
  ...record,
  organizationId: record.organization as OrganizationId,
  clientId: record.clientId as ClientId,
  serviceId: record.serviceId as ServiceId,
  name: record.clientName,
  secret: record.clientSecret || undefined,
  // FIXME: Don't cast like that!
  responseTypes: record.responseTypes.map((_) => _ as ResponseType),
});

const toRecord = (client: Client): prisma.Client => ({
  clientId: client.clientId,
  redirectUris: client.redirectUris,
  grantTypes: client.grantTypes,
  responseTypes: client.responseTypes,
  applicationType: client.applicationType,
  issuedAt: client.issuedAt,
  clientName: client.name,
  clientSecret: client.secret || null,
  idTokenSignedResponseAlg: client.idTokenSignedResponseAlg,
  postLogoutRedirectUris: client.postLogoutRedirectUris,
  requireAuthTime: client.requireAuthTime,
  scope: client.scope,
  subjectType: client.subjectType,
  tokenEndpointAuthMethod: client.tokenEndpointAuthMethod,
  organization: client.organizationId,
  serviceId: client.serviceId,
  bypassConsent: client.bypassConsent,
});

const removeClient =
  (logger: Logger) =>
  <T>(client: Prisma.ClientDelegate<T>) =>
  (id: ClientId) =>
    pipe(
      TE.tryCatch(
        () =>
          client.delete({
            where: { clientId: id },
          }),
        E.toError
      ),
      TE.orElseFirst((e) => TE.of(logger.error(`Error on removeClient`, e))),
      TE.bimap(
        (e) => ({ causedBy: e, kind: DomainErrorTypes.GENERIC_ERROR }),
        constVoid
      )
    );

const upsertClient =
  (logger: Logger) =>
  <T>(client: Prisma.ClientDelegate<T>) =>
  (clientDefinition: Client) => {
    const obj = toRecord(clientDefinition);
    return pipe(
      TE.tryCatch(
        () =>
          client.upsert({
            create: obj,
            update: obj,
            where: { clientId: clientDefinition.clientId },
          }),
        E.toError
      ),
      TE.orElseFirst((e) =>
        TE.of(logger.error(`Error on upsertGrant ${JSON.stringify(e)}`, e))
      ),
      TE.bimap(
        (e) => ({ causedBy: e, kind: DomainErrorTypes.GENERIC_ERROR }),
        (_) => clientDefinition
      )
    );
  };

const findClient =
  (logger: Logger) =>
  <T>(client: Prisma.ClientDelegate<T>) =>
  (id: ClientId) =>
    pipe(
      TE.tryCatch(
        () => client.findUnique({ where: { clientId: id } }),
        E.toError
      ),
      TE.map(flow(O.fromNullable, O.map(fromRecord))),
      TE.mapLeft((e) => ({
        causedBy: e,
        kind: DomainErrorTypes.GENERIC_ERROR,
      })),
      TE.chainFirst((c) =>
        TE.of(logger.debug(`findClient ${JSON.stringify(c)}`))
      ),
      TE.orElseFirst((e) =>
        TE.of(logger.error(`Error on findClient ${JSON.stringify(e)}`))
      )
    );

const listClient =
  (logger: Logger) =>
  <T>(client: Prisma.ClientDelegate<T>) =>
  (selector: ClientSelector) =>
    pipe(
      TE.tryCatch(
        () =>
          client.findMany({
            where: {
              organization: selector.organizationId,
              serviceId: selector.serviceId,
            },
          }),
        E.toError
      ),
      TE.map(flow(A.map(fromRecord))),
      TE.mapLeft((e) => ({
        causedBy: e,
        kind: DomainErrorTypes.GENERIC_ERROR,
      })),
      TE.chainFirst((c) =>
        TE.of(logger.debug(`listClient ${JSON.stringify(c)}`))
      ),
      TE.orElseFirst((e) =>
        TE.of(logger.error(`Error on listClient ${JSON.stringify(e)}`))
      )
    );

/**
 * Create a ClientRepository instance that uses PostgreSQL as backing store
 */
export const makeClientRepository = (
  config: PostgresConfig,
  logger: Logger,
  client: PrismaClient = new PrismaClient({
    datasources: { db: { url: config.url.href } },
  })
): ClientRepository => ({
  find: findClient(logger)(client.client),
  remove: removeClient(logger)(client.client),
  upsert: upsertClient(logger)(client.client),
  list: listClient(logger)(client.client),
});
