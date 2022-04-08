import * as t from "io-ts";
import * as tt from "io-ts-types";

export const AsymmetricSigningAlgorithm = t.union([
  t.literal("PS256"),
  t.literal("PS384"),
  t.literal("PS512"),
  t.literal("ES256"),
  t.literal("ES256K"),
  t.literal("ES384"),
  t.literal("ES512"),
  t.literal("EdDSA"),
  t.literal("RS256"),
  t.literal("RS384"),
  t.literal("RS512"),
]);
export type AsymmetricSigningAlgorithm = t.TypeOf<
  typeof AsymmetricSigningAlgorithm
>;
export const SymmetricSigningAlgorithm = t.union([
  t.literal("HS256"),
  t.literal("HS384"),
  t.literal("HS512"),
]);
export type SymmetricSigningAlgorithm = t.TypeOf<
  typeof SymmetricSigningAlgorithm
>;
export const NoneAlg = t.literal("none");
export type NoneAlg = t.TypeOf<typeof NoneAlg>;

export const ResponseType = t.union([
  t.literal("code"),
  t.literal("id_token"),
  t.literal("code id_token"),
  t.literal("id_token token"),
  t.literal("code token"),
  t.literal("code id_token token"),
  t.literal("none"),
]);
export type ResponseType = t.TypeOf<typeof ResponseType>;

interface ClientIdBrand {
  readonly ClientId: unique symbol;
}
// ClientId is just a string, refinement is useful to avoid
// parameters switch
export const ClientId = t.brand(
  t.string,
  (s): s is t.Branded<string, ClientIdBrand> => t.string.is(s),
  "ClientId"
);
export type ClientId = t.TypeOf<typeof ClientId>;

interface OrganizationIdBrand {
  readonly OrganizationId: unique symbol;
}
// OrganizationId is just a string, refinement is useful to avoid
// parameters switch
export const OrganizationId = t.brand(
  t.string,
  (s): s is t.Branded<string, OrganizationIdBrand> => t.string.is(s),
  "OrganizationId"
);
export type OrganizationId = t.TypeOf<typeof OrganizationId>;

interface ServiceIdBrand {
  readonly ServiceId: unique symbol;
}
// ServiceId is just a string, refinement is useful to avoid
// parameters switch
export const ServiceId = t.brand(
  t.string,
  (s): s is t.Branded<string, ServiceIdBrand> => t.string.is(s),
  "ServiceId"
);
export type ServiceId = t.TypeOf<typeof ServiceId>;

export const ClientSelector = t.type({
  organizationId: t.union([OrganizationId, t.undefined]),
  serviceId: t.union([ServiceId, t.undefined]),
});
export type ClientSelector = t.TypeOf<typeof ClientSelector>;

export const Client = t.type({
  applicationType: t.union([t.literal("web"), t.literal("native")]),
  bypassConsent: t.boolean,
  clientId: ClientId,
  grantTypes: t.array(t.string),
  idTokenSignedResponseAlg: t.union([
    AsymmetricSigningAlgorithm,
    SymmetricSigningAlgorithm,
    NoneAlg,
  ]),
  issuedAt: tt.date,
  name: t.string,
  organizationId: OrganizationId,
  postLogoutRedirectUris: t.array(t.string),
  redirectUris: t.array(t.string),
  requireAuthTime: t.boolean,
  responseTypes: t.array(ResponseType),
  scope: t.string,
  secret: t.union([t.string, t.undefined]),
  serviceId: ServiceId,
  subjectType: t.union([t.literal("public"), t.literal("pairwise")]),
  tokenEndpointAuthMethod: t.union([
    t.literal("none"),
    t.literal("client_secret_post"),
    t.literal("client_secret_jwt"),
    t.literal("private_key_jwt"),
    t.literal("tls_client_auth"),
    t.literal("self_signed_tls_client_auth"),
    t.literal("client_secret_basic"),
  ]),
});
export type Client = t.TypeOf<typeof Client>;
