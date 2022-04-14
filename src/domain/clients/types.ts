import * as t from "io-ts";
import * as tt from "io-ts-types";

interface ClientIdBrand {
  readonly ClientId: unique symbol;
}
// ClientId is just a string
export const ClientId = t.brand(
  t.string,
  (s): s is t.Branded<string, ClientIdBrand> => t.string.is(s),
  "ClientId"
);
export type ClientId = t.TypeOf<typeof ClientId>;

interface ServiceIdBrand {
  readonly ServiceId: unique symbol;
}
// ServiceId is just a string
export const ServiceId = t.brand(
  t.string,
  (s): s is t.Branded<string, ServiceIdBrand> => t.string.is(s),
  "ServiceId"
);
export type ServiceId = t.TypeOf<typeof ServiceId>;

interface OrganizationIdBrand {
  readonly OrganizationId: unique symbol;
}
// OrganizationId is just a string
export const OrganizationId = t.brand(
  t.string,
  (s): s is t.Branded<string, OrganizationIdBrand> => t.string.is(s),
  "OrganizationId"
);
export type OrganizationId = t.TypeOf<typeof OrganizationId>;

/**
 * Represents a client of OpenID Connect
 */
export const Client = t.type({
  clientId: ClientId,
  grantTypes: t.array(t.literal("implicit")),
  issuedAt: tt.date,
  name: t.string,
  organizationId: OrganizationId,
  redirectUris: t.array(t.string),
  responseTypes: t.array(t.literal("id_token")),
  scope: t.string,
  serviceId: ServiceId,
});
export type Client = t.TypeOf<typeof Client>;
