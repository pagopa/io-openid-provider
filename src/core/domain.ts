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

export const Client = t.type({
  application_type: t.literal("web"),
  client_id: t.string,
  grant_types: t.literal("implicit"),
  id_token_signed_response_alg: t.string,
  organization: t.string,
});
export type Client = t.TypeOf<typeof Client>;
