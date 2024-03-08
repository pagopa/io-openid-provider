import { pipe } from "fp-ts/lib/function.js";
import * as E from "fp-ts/lib/Either.js";
import * as t from "io-ts";
import * as tt from "io-ts-types";
import {
  NonEmptyString,
  OrganizationFiscalCode,
} from "@pagopa/ts-commons/lib/strings.js";

// ServiceId is just a string
export const ServiceId = NonEmptyString;
export type ServiceId = t.TypeOf<typeof ServiceId>;

interface OrganizationIdBrand {
  readonly OrganizationId: unique symbol;
}
// OrganizationId is just a string
export const OrganizationId = t.brand(
  OrganizationFiscalCode,
  (s): s is t.Branded<OrganizationFiscalCode, OrganizationIdBrand> =>
    OrganizationFiscalCode.is(s),
  "OrganizationId"
);
export type OrganizationId = t.TypeOf<typeof OrganizationId>;
const ClientId = t.strict({
  organizationId: OrganizationId,
  serviceId: ServiceId,
});
export type ClientId = t.TypeOf<typeof ClientId>;

const separator = ":";
const ClientIdFromString = new t.Type<ClientId, string>(
  "ClientIdFromString",
  (s): s is ClientId => ClientId.is(s),
  (s, ctx) =>
    pipe(
      t.string.validate(s, ctx),
      E.chain((str) => {
        const [orgIdStr, srvIdStr] = str.split(separator);
        const makeClientId =
          (organizationId: OrganizationId) => (serviceId: ServiceId) => ({
            organizationId,
            serviceId,
          });
        return pipe(
          E.of(makeClientId),
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
