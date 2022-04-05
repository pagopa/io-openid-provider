import * as oidc from "oidc-provider";
import * as t from "io-ts";
import { constVoid, pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { Logger } from "../../logger";
import { ClientRepository } from "../../core/repositories/ClientRepository";
import {
  AsymmetricSigningAlgorithm,
  Client,
  ClientId,
  makeDomainError,
  NoneAlg,
  OrganizationId,
  ResponseType,
  ServiceId,
  SymmetricSigningAlgorithm,
} from "../../core/domain";
import {
  fromNumericDate,
  toNumericDate,
  makeNotImplementedAdapter,
  taskEitherToPromise,
} from "./utils";

export const ClientPayload = t.type({
  application_type: t.union([t.literal("web"), t.literal("native")]),
  bypass_consent: t.union([t.boolean, t.undefined]),
  client_id: t.string,
  client_id_issued_at: t.number,
  client_name: t.string,
  client_secret: t.union([t.string, t.undefined]),
  grant_types: t.array(t.string),
  id_token_signed_response_alg: t.union([
    AsymmetricSigningAlgorithm,
    SymmetricSigningAlgorithm,
    NoneAlg,
  ]),
  organization_id: t.string,
  post_logout_redirect_uris: t.array(t.string),
  redirect_uris: t.array(t.string),
  require_auth_time: t.boolean,
  response_types: t.array(ResponseType),
  scope: t.string,
  service_id: t.string,
  subject_type: t.union([t.literal("public"), t.literal("pairwise")]),
  token_endpoint_auth_method: t.union([
    t.literal("none"),
    t.literal("client_secret_post"),
    t.literal("client_secret_jwt"),
    t.literal("private_key_jwt"),
    t.literal("tls_client_auth"),
    t.literal("self_signed_tls_client_auth"),
    t.literal("client_secret_basic"),
  ]),
});
export type ClientPayload = t.TypeOf<typeof ClientPayload>;

export const toAdapterPayload = (item: Client): ClientPayload => ({
  application_type: item.applicationType,
  bypass_consent: item.bypassConsent,
  client_id: item.clientId,
  client_id_issued_at: toNumericDate(item.issuedAt),
  client_name: item.name,
  client_secret: item.secret,
  grant_types: item.grantTypes,
  id_token_signed_response_alg: item.idTokenSignedResponseAlg,
  organization_id: item.organizationId,
  post_logout_redirect_uris: item.postLogoutRedirectUris,
  redirect_uris: item.redirectUris,
  require_auth_time: item.requireAuthTime,
  response_types: item.responseTypes,
  scope: item.scope,
  service_id: item.serviceId,
  subject_type: item.subjectType,
  token_endpoint_auth_method: item.tokenEndpointAuthMethod,
});

export const fromAdapterPayload = (
  item: oidc.AdapterPayload
): t.Validation<Client> =>
  pipe(
    ClientPayload.decode(item),
    E.map((clientPayload) => ({
      applicationType: clientPayload.application_type,
      bypassConsent: clientPayload.bypass_consent || false,
      clientId: clientPayload.client_id as ClientId,
      grantTypes: clientPayload.grant_types,
      idTokenSignedResponseAlg: clientPayload.id_token_signed_response_alg,
      issuedAt: fromNumericDate(clientPayload.client_id_issued_at),
      name: clientPayload.client_name,
      organizationId: clientPayload.organization_id as OrganizationId,
      postLogoutRedirectUris: clientPayload.post_logout_redirect_uris,
      redirectUris: clientPayload.redirect_uris,
      requireAuthTime: clientPayload.require_auth_time,
      responseTypes: clientPayload.response_types,
      scope: clientPayload.scope,
      secret: clientPayload.client_secret,
      serviceId: clientPayload.service_id as ServiceId,
      subjectType: clientPayload.subject_type,
      tokenEndpointAuthMethod: clientPayload.token_endpoint_auth_method,
    }))
  );

export const makeClientAdapter = (
  logger: Logger,
  clientRepository: ClientRepository
): oidc.Adapter => ({
  ...makeNotImplementedAdapter("Client", logger),
  // remove a client
  destroy: (id: string) => {
    logger.debug(`Client destroy, id: ${id}`);
    const result = pipe(
      pipe(ClientId.decode(id), E.mapLeft(makeDomainError), TE.fromEither),
      TE.chain(clientRepository.remove)
    );
    return taskEitherToPromise(result);
  },
  // given the identifier return a client
  find: (id: string) => {
    logger.debug(`Client find, id: ${id}`);
    const result = pipe(
      pipe(ClientId.decode(id), E.mapLeft(makeDomainError), TE.fromEither),
      TE.chain(clientRepository.find),
      TE.map(O.map(toAdapterPayload)),
      TE.map(O.toUndefined)
    );
    return taskEitherToPromise(result);
  },
  // insert or update the client identified with the given id
  upsert: (id: string, payload: oidc.AdapterPayload, expiresIn: number) => {
    logger.debug(
      `Client upsert, id: ${id}, _expiresIn: ${expiresIn}, payload: ${JSON.stringify(
        payload
      )}`
    );
    const result = pipe(
      TE.fromEither(fromAdapterPayload(payload)),
      TE.mapLeft(makeDomainError),
      TE.orElseFirst((e) =>
        TE.of(
          logger.error("Some error during the upsert operation: ", e.causedBy)
        )
      ),
      TE.chain(clientRepository.upsert),
      TE.map(constVoid)
    );
    return taskEitherToPromise(result);
  },
});
