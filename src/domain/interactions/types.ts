import * as t from "io-ts";
import * as tt from "io-ts-types";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings.js";
import { IdentityId } from "../identities/types.js";
import { Client } from "../clients/types.js";
import { GrantId } from "../grants/types.js";

interface InteractionIdBrand {
  readonly InteractionId: unique symbol;
}
// InteractionId is just a string
export const InteractionId = t.brand(
  NonEmptyString,
  (s): s is t.Branded<NonEmptyString, InteractionIdBrand> =>
    NonEmptyString.is(s),
  "InteractionId"
);
export type InteractionId = t.TypeOf<typeof InteractionId>;

export const RequestParams = t.type({
  client_id: Client.props.clientId,
  nonce: t.union([t.undefined, t.string]),
  redirect_uri: t.string,
  response_mode: t.union([
    t.undefined,
    t.literal("query"),
    t.literal("fragment"),
    t.literal("form_post"),
  ]),
  response_type: t.string,
  scope: t.string,
  state: t.string,
});
export type RequestParams = t.TypeOf<typeof RequestParams>;

export const Payload = tt.JsonRecord;
export type Payload = t.TypeOf<typeof Payload>;

export const ErrorResult = t.type({
  error: t.string,
});
export const LoginResult = t.type({
  identityId: IdentityId,
});
export const ConsentResult = t.type({
  grantId: GrantId,
  identityId: IdentityId,
});

export const Interaction = t.type({
  expireAt: tt.date,
  id: InteractionId,
  issuedAt: tt.date,
  // kind: t.union([t.literal("login"), t.literal("consent")]),
  params: RequestParams,
  payload: Payload,
  result: t.union([t.undefined, LoginResult, ConsentResult, ErrorResult]),
});
export type Interaction = t.TypeOf<typeof Interaction>;

export const makeResult =
  (grantId: GrantId | undefined) =>
  (identityId: IdentityId | undefined) =>
  (error: string | undefined): Interaction["result"] => {
    if (grantId && identityId) {
      return { grantId, identityId };
    } else if (identityId) {
      return { identityId };
    } else if (error) {
      return { error };
    } else {
      return undefined;
    }
  };
