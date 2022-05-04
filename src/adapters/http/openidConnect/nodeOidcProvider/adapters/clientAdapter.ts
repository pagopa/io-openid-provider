import * as oidc from "oidc-provider";
import * as t from "io-ts";
import { pipe } from "fp-ts/function";
import * as E from "fp-ts/Either";
import { Logger } from "../../../../../domain/logger";
import { ClientService } from "../../../../../domain/clients/ClientService";
import {
  Client,
  ClientId,
  GrantTypes,
  ResponseTypes,
} from "../../../../../domain/clients/types";
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
  client_id: Client.props.clientId.encode(client.clientId),
  client_id_issued_at: DateFromNumericDate.encode(client.issuedAt),
  client_name: client.name,
  client_secret: undefined,
  grant_types: client.grantTypes,
  id_token_signed_response_alg: "RS256",
  organization_id: client.clientId.organizationId,
  post_logout_redirect_uris: [],
  redirect_uris: client.redirectUris.concat(),
  require_auth_time: false,
  response_types: client.responseTypes,
  scope: client.scope,
  service_id: client.clientId.serviceId,
  subject_type: "public",
  token_endpoint_auth_method: "none",
});

const adapterPayloadToClient = (
  payload: oidc.AdapterPayload
): t.Validation<Client> =>
  pipe(
    E.of(
      (clientId: ClientId) =>
        (grantTypes: GrantTypes) =>
        (redirectUris: ReadonlyArray<string>) =>
        (responseTypes: ResponseTypes) =>
        (issuedAt: Date) => ({
          clientId,
          grantTypes,
          issuedAt,
          name: payload.client_name || "",
          organizationId: clientId.organizationId,
          redirectUris,
          responseTypes,
          scope: payload.scope || "",
          serviceId: clientId.serviceId,
        })
    ),
    E.ap(Client.props.clientId.decode(payload.client_id)),
    E.ap(GrantTypes.decode(payload.grant_types)),
    E.ap(t.readonlyArray(t.string).decode(payload.redirect_uris)),
    E.ap(ResponseTypes.decode(payload.response_types)),
    E.ap(DateFromNumericDate.decode(payload.client_id_issued_at))
  );

export const makeClientAdapter = (
  logger: Logger,
  clientService: ClientService
): oidc.Adapter => ({
  ...makeNotImplementedAdapter("Client", logger),
  destroy: destroyFromTE(
    logger,
    "Client",
    Client.props.clientId.decode,
    clientService.remove
  ),
  find: findFromTEO(
    logger,
    "Client",
    Client.props.clientId.decode,
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
