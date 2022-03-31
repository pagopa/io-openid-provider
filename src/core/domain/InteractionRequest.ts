import * as t from "io-ts";
import { ClientId } from "./Client";
import { AccountId, GrantId } from "./Grant";

interface InteractionRequestIdBrand {
  readonly InteractionRequestId: unique symbol;
}
// InteractionRequestId is just a string
export const InteractionRequestId = t.brand(
  t.string,
  (s): s is t.Branded<string, InteractionRequestIdBrand> => t.string.is(s),
  "InteractionRequestId"
);
export type InteractionRequestId = t.TypeOf<typeof InteractionRequestId>;

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

export const Session = t.type({
  accountId: AccountId,
  cookieId: t.string,
  uid: t.string,
});

export const InteractionRequest = t.type({
  clientId: ClientId,
  // number of second since epoch (aka NumericDate) https://stackoverflow.com/a/39926886
  expireAt: t.number,
  id: InteractionRequestId,
  // number of second since epoch (aka NumericDate) https://stackoverflow.com/a/39926886
  issuedAt: t.number,
  params: Params,
  prompt: Prompt,
  result: t.union([t.undefined, LoginResult, ConsentResult, ErrorResult]),
  returnTo: t.string,
  session: t.union([t.undefined, Session]),
});
export type InteractionRequest = t.TypeOf<typeof InteractionRequest>;
