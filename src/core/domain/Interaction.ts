import * as t from "io-ts";
import * as tt from "io-ts-types";
import { ClientId } from "./Client";
import { AccountId, GrantId } from "./Grant";

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

export const ErrorResult = t.type({
  error: t.string,
});
export const LoginResult = t.type({
  login: t.type({
    accountId: AccountId,
  }),
});
export const ConsentResult = t.type({
  consent: t.type({
    grantId: GrantId,
  }),
});

export const Params = t.type({
  client_id: t.string,
  nonce: t.string,
  redirect_uri: t.string,
  response_type: t.string,
  scope: t.string,
  state: t.string,
});

export const Prompt = t.type({
  details: t.union([
    t.record(t.string, t.string),
    // missingOIDCScope exists only if consent
    t.type({ missingOIDCScope: t.array(t.string) }),
  ]),
  name: t.string,
  reasons: t.array(t.string),
});

const SessionInfo = t.type({
  accountId: AccountId,
  cookieId: t.string,
  // TODO: Check if this uid could be collapsed to sessionId
  uid: t.string,
});

export const Interaction = t.type({
  clientId: ClientId,
  expireAt: tt.date,
  id: InteractionId,
  issuedAt: tt.date,
  params: Params,
  prompt: Prompt,
  result: t.union([t.undefined, LoginResult, ConsentResult, ErrorResult]),
  returnTo: t.string,
  session: t.union([t.undefined, SessionInfo]),
});
export type Interaction = t.TypeOf<typeof Interaction>;
