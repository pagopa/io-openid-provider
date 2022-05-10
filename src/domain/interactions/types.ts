import * as t from "io-ts";
import * as tt from "io-ts-types";
import { IdentityId } from "../identities/types";
import { Client } from "../clients/types";
import { GrantId } from "../grants/types";

interface InteractionIdBrand {
  readonly InteractionId: unique symbol;
}
// InteractionId is just a string
export const InteractionId = t.brand(
  t.string,
  (s): s is t.Branded<string, InteractionIdBrand> => t.string.is(s),
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
  scope: t.union([t.undefined, t.string]),
  state: t.string,
});
export type RequestParams = t.TypeOf<typeof RequestParams>;

export const Payload = tt.JsonRecord;
export type Payload = t.TypeOf<typeof Payload>;

export const ErrorResult = t.type({
  error: t.string,
});
export const LoginResult = t.type({
  identity: IdentityId,
});
export const ConsentResult = t.type({
  grantId: GrantId,
});

export const SessionInfo = t.type({
  cookieId: t.string,
  identityId: IdentityId,
  // TODO: Check if this uid could be collapsed to sessionId
  // uid: t.string,
});
export type SessionInfo = t.TypeOf<typeof SessionInfo>;

export const Interaction = t.type({
  expireAt: tt.date,
  id: InteractionId,
  issuedAt: tt.date,
  // kind: t.union([t.literal("login"), t.literal("consent")]),
  params: RequestParams,
  payload: Payload,
  result: t.union([t.undefined, LoginResult, ConsentResult, ErrorResult]),
  returnTo: t.string,
  session: t.union([t.undefined, SessionInfo]),
});
export type Interaction = t.TypeOf<typeof Interaction>;
