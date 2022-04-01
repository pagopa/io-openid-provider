import * as t from "io-ts";
import { AccountId } from "./Grant";

interface SessionIdBrand {
  readonly SessionId: unique symbol;
}
// SessionId is just a string
export const SessionId = t.brand(
  t.string,
  (s): s is t.Branded<string, SessionIdBrand> => t.string.is(s),
  "SessionId"
);
export type SessionId = t.TypeOf<typeof SessionId>;

export const Session = t.type({
  accountId: t.union([t.undefined, AccountId]),
  expireAt: t.number,
  id: SessionId,
  issuedAt: t.number,
  kind: t.literal("Session"),
  // TODO: Check if this uid could be collapsed to id
  uid: t.string,
});
export type Session = t.TypeOf<typeof Session>;
