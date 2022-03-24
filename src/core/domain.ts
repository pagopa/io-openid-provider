/* eslint-disable sort-keys */
import * as t from "io-ts";

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

export const Client = t.type({
  client_id: t.string,
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
  organization: t.string,
  bypass_consent: t.boolean,
});
export type Client = t.TypeOf<typeof Client>;
