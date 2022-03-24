/* eslint-disable sort-keys */
import * as prisma from "@prisma/client";
import { Prisma, PrismaClient } from "@prisma/client";
import { constVoid, flow, pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { Logger } from "src/logger";
import { Client, DomainErrorTypes, ResponseType } from "../core/domain";
import { ClientRepository } from "../core/repositories/ClientRepository";
import { PostgresConfig } from "./domain";

const fromDBClientToClient = (c: prisma.Client): Client => ({
  application_type: c.applicationType,
  bypass_consent: c.bypassConsent,
  client_id: c.clientId,
  client_id_issued_at: c.clientIdIssuedAt.getTime(),
  client_name: c.clientName,
  client_secret: c.clientSecret || undefined,
  grant_types: c.grantTypes,
  id_token_signed_response_alg: c.idTokenSignedResponseAlg,
  organization: c.organization,
  post_logout_redirect_uris: c.postLogoutRedirectUris,
  require_auth_time: c.requireAuthTime,
  // FIXME: Don't cast like that!
  response_types: c.responseTypes.map((_) => _ as ResponseType),
  redirect_uris: c.redirectUris,
  scope: c.scope,
  subject_type: c.subjectType,
  token_endpoint_auth_method: c.tokenEndpointAuthMethod,
});

const fromClientToDBClient = (clientDefinition: Client): prisma.Client => ({
  applicationType: clientDefinition.application_type,
  bypassConsent: clientDefinition.bypass_consent,
  clientId: clientDefinition.client_id,
  clientIdIssuedAt: new Date(clientDefinition.client_id_issued_at),
  clientName: clientDefinition.client_name,
  clientSecret: clientDefinition.client_secret || null,
  grantTypes: clientDefinition.grant_types,
  idTokenSignedResponseAlg: clientDefinition.id_token_signed_response_alg,
  organization: clientDefinition.organization,
  postLogoutRedirectUris: clientDefinition.post_logout_redirect_uris,
  requireAuthTime: clientDefinition.require_auth_time,
  responseTypes: clientDefinition.response_types,
  redirectUris: clientDefinition.redirect_uris,
  scope: clientDefinition.scope,
  subjectType: clientDefinition.subject_type,
  tokenEndpointAuthMethod: clientDefinition.token_endpoint_auth_method,
});

const removeClient =
  (logger: Logger) =>
  <T>(client: Prisma.ClientDelegate<T>) =>
  (id: string) =>
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
    const obj = fromClientToDBClient(clientDefinition);
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
        TE.of(logger.error(`Error on removeClient ${JSON.stringify(e)}`))
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
  (id: string) =>
    pipe(
      TE.tryCatch(
        () => client.findUnique({ where: { clientId: id } }),
        E.toError
      ),
      TE.map(flow(O.fromNullable, O.map(fromDBClientToClient))),
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

/**
 * Create a ClientRepository instance that uses PostgreSQL as backing store
 */
export const makeClientRepository = (
  config: PostgresConfig,
  logger: Logger
): ClientRepository => {
  const client = new PrismaClient({
    datasources: { db: { url: config.url.href } },
  });
  return {
    find: findClient(logger)(client.client),
    remove: removeClient(logger)(client.client),
    upsert: upsertClient(logger)(client.client),
  };
};
