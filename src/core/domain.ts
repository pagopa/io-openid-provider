/* eslint-disable sort-keys */
import * as t from "io-ts";
import * as PR from "io-ts/PathReporter";

export enum DomainErrorTypes {
  GENERIC_ERROR,
  NOT_IMPLEMENTED,
}

export const DomainError = t.type({
  causedBy: t.union([
    t.type({
      message: t.string,
      name: t.string,
    }),
    t.undefined,
  ]),
  kind: t.union([
    t.literal(DomainErrorTypes.GENERIC_ERROR),
    t.literal(DomainErrorTypes.NOT_IMPLEMENTED),
  ]),
});
export type DomainError = t.TypeOf<typeof DomainError>;
export const makeDomainError = (e: t.Errors): DomainError => ({
  causedBy: new Error(PR.failure(e).join("\n")),
  kind: DomainErrorTypes.GENERIC_ERROR,
});

const AsymmetricSigningAlgorithm = t.union([
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
const SymmetricSigningAlgorithm = t.union([
  t.literal("HS256"),
  t.literal("HS384"),
  t.literal("HS512"),
]);
const NoneAlg = t.literal("none");

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
  client_id: ClientId,
  redirect_uris: t.array(t.string),
  grant_types: t.array(t.string),
  response_types: t.array(ResponseType),
  application_type: t.union([t.literal("web"), t.literal("native")]),
  client_id_issued_at: t.number,
  client_name: t.string,
  client_secret: t.union([t.string, t.undefined]),
  id_token_signed_response_alg: t.union([
    AsymmetricSigningAlgorithm,
    SymmetricSigningAlgorithm,
    NoneAlg,
  ]),
  post_logout_redirect_uris: t.array(t.string),
  require_auth_time: t.boolean,
  scope: t.string,
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
  organization: OrganizationId,
  serviceId: ServiceId,
  bypass_consent: t.boolean,
});
export type Client = t.TypeOf<typeof Client>;

interface RegistrationAccessTokenIdBrand {
  readonly RegistrationAccessTokenId: unique symbol;
}
export const RegistrationAccessTokenId = t.brand(
  t.string,
  (s): s is t.Branded<string, RegistrationAccessTokenIdBrand> => t.string.is(s),
  "RegistrationAccessTokenId"
);
export type RegistrationAccessTokenId = t.TypeOf<
  typeof RegistrationAccessTokenId
>;

export const RegistrationAccessToken = t.type({
  clientId: ClientId,
  iat: t.number,
  id: RegistrationAccessTokenId,
});
/** Represents the access-token issued to the client during registration phase */
export type RegistrationAccessToken = t.TypeOf<typeof RegistrationAccessToken>;
