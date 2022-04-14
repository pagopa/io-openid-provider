import * as t from "io-ts";
import * as tt from "io-ts-types";
import { IdentityId } from "../identities/types";
import { ClientId } from "../clients/types";
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
  client_id: ClientId,
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

export const ErrorResult = t.type({
  error: t.string,
});
export const LoginResult = t.type({
  identity: IdentityId,
});
export const ConsentResult = t.type({
  grantId: GrantId,
});

const SessionInfo = t.type({
  cookieId: t.string,
  identityId: IdentityId,
  // TODO: Check if this uid could be collapsed to sessionId
  // uid: t.string,
});

export const Interaction = t.type({
  expireAt: tt.date,
  id: InteractionId,
  issuedAt: tt.date,
  // kind: t.union([t.literal("login"), t.literal("consent")]),
  params: RequestParams,
  payload: t.record(t.string, t.unknown),
  result: t.union([t.undefined, LoginResult, ConsentResult, ErrorResult]),
  returnTo: t.string,
  session: t.union([t.undefined, SessionInfo]),
});
export type Interaction = t.TypeOf<typeof Interaction>;

/**
 * Given an interaction return the step
 */
export const interactionStep = (
  interaction: Interaction
): "login" | "consent" => {
  if (interaction.result === undefined) {
    return "login";
  } else {
    return "consent";
  }
};
