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

const fromRecord = (c: prisma.Client): Client => ({
  application_type: c.applicationType,
  bypass_consent: c.bypassConsent,
  // FIXME: Don't cast like that!
  client_id: c.clientId as ClientId,
  client_id_issued_at: c.clientIdIssuedAt.getTime(),
  client_name: c.clientName,
  client_secret: c.clientSecret || undefined,
  grant_types: c.grantTypes,
  id_token_signed_response_alg: c.idTokenSignedResponseAlg,
  organization_id: c.organization as OrganizationId,
  service_id: c.serviceId as ServiceId,
  post_logout_redirect_uris: c.postLogoutRedirectUris,
  require_auth_time: c.requireAuthTime,
  // FIXME: Don't cast like that!
  response_types: c.responseTypes.map((_) => _ as ResponseType),
  redirect_uris: c.redirectUris,
  scope: c.scope,
  subject_type: c.subjectType,
  token_endpoint_auth_method: c.tokenEndpointAuthMethod,
});

const toRecord = (client: Client): prisma.Client => ({
  applicationType: client.application_type,
  bypassConsent: client.bypass_consent || false,
  clientId: client.client_id,
  clientIdIssuedAt: new Date(client.client_id_issued_at),
  clientName: client.client_name,
  clientSecret: client.client_secret || null,
  grantTypes: client.grant_types,
  idTokenSignedResponseAlg: client.id_token_signed_response_alg,
  organization: client.organization_id,
  serviceId: client.service_id,
  postLogoutRedirectUris: client.post_logout_redirect_uris,
  requireAuthTime: client.require_auth_time,
  responseTypes: client.response_types,
  redirectUris: client.redirect_uris,
  scope: client.scope,
  subjectType: client.subject_type,
  tokenEndpointAuthMethod: client.token_endpoint_auth_method,
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
            where: { clientId: clientDefinition.client_id },
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
      TE.bimap(
        (e) => ({ causedBy: e, kind: DomainErrorTypes.GENERIC_ERROR }),
        O.toUndefined
      ),
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
