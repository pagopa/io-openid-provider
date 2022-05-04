import { pipe } from "fp-ts/lib/function";
import * as E from "fp-ts/lib/Either";
import * as t from "io-ts";
import * as tt from "io-ts-types";

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

const ClientId = t.strict({
  organizationId: OrganizationId,
  serviceId: ServiceId,
});
export type ClientId = t.TypeOf<typeof ClientId>;

const separator = ":";
const ClientIdFromString = new t.Type<ClientId, string, unknown>(
  "ClientIdFromString",
  (s): s is ClientId => ClientId.is(s),
  (s, _ctx) =>
    pipe(
      t.string.decode(s),
      E.chain((str) => {
        const [orgIdStr, srvIdStr] = str.split(separator);
        return pipe(
          E.of((organizationId: OrganizationId) => (serviceId: ServiceId) => ({
            organizationId,
            serviceId,
          })),
          E.ap(OrganizationId.decode(orgIdStr)),
          E.ap(ServiceId.decode(srvIdStr))
        );
      })
    ),
  (clientId) => `${clientId.organizationId}${separator}${clientId.serviceId}`
);

export const GrantTypes = t.array(t.literal("implicit"));
export type GrantTypes = t.TypeOf<typeof GrantTypes>;

export const ResponseTypes = t.array(t.literal("id_token"));
export type ResponseTypes = t.TypeOf<typeof ResponseTypes>;

/**
 * Represents a client of OpenID Connect
 */
export const Client = t.type({
  clientId: ClientIdFromString,
  grantTypes: GrantTypes,
  issuedAt: tt.date,
  name: t.string,
  redirectUris: t.readonlyArray(t.string),
  responseTypes: ResponseTypes,
  scope: t.string,
});
export type Client = t.TypeOf<typeof Client>;
