import * as oidc from "oidc-provider";
import * as t from "io-ts";
import { Logger } from "../../../../../domain/logger";
import { ClientService } from "../../../../../domain/clients/ClientService";
import { Client, ClientId } from "../../../../../domain/clients/types";
import {
  makeNotImplementedAdapter,
  findFromTEO,
  destroyFromTE,
  upsertFromTE,
  DateFromNumericDate,
} from "../utils";

const clientToAdapterPayload = (client: Client): oidc.AdapterPayload => ({
  application_type: "web",
  bypass_consent: false,
  client_id: client.clientId,
  client_id_issued_at: DateFromNumericDate.encode(client.issuedAt),
  client_name: client.name,
  client_secret: undefined,
  grant_types: client.grantTypes,
  id_token_signed_response_alg: "RS256",
  organization_id: client.organizationId,
  post_logout_redirect_uris: [],
  redirect_uris: client.redirectUris,
  require_auth_time: false,
  response_types: client.responseTypes,
  scope: client.scope,
  service_id: client.serviceId,
  subject_type: "public",
  token_endpoint_auth_method: "none",
});

const adapterPayloadToClient = (
  payload: oidc.AdapterPayload
): t.Validation<Client> =>
  Client.decode({
    clientId: payload.client_id,
    grantTypes: payload.grant_types,
    issuedAt: new Date(),
    name: payload.client_name,
    organizationId: payload.organization_id,
    redirectUris: payload.redirect_uris,
    responseTypes: payload.response_types,
    scope: payload.scope,
    serviceId: payload.service_id,
  });

export const makeClientAdapter = (
  logger: Logger,
  clientService: ClientService
): oidc.Adapter => ({
  ...makeNotImplementedAdapter("Client", logger),
  destroy: destroyFromTE(
    logger,
    "Client",
    ClientId.decode,
    clientService.remove
  ),
  find: findFromTEO(
    logger,
    "Client",
    ClientId.decode,
    clientToAdapterPayload,
    clientService.find
  ),
  upsert: upsertFromTE(
    logger,
    "Client",
    adapterPayloadToClient,
    clientService.upsert
  ),
});
