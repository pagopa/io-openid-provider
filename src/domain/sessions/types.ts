import * as t from "io-ts";
import * as tt from "io-ts-types";
import { IdentityId } from "../identities/types";

interface UidBrand {
  readonly Uid: unique symbol;
}
// Uid is just a string
export const Uid = t.brand(
  t.string,
  (s): s is t.Branded<string, UidBrand> => t.string.is(s),
  "Uid"
);
export type Uid = t.TypeOf<typeof Uid>;

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

export const Session = t.interface({
  expireAt: tt.date,
  id: SessionId,
  identityId: t.union([t.undefined, IdentityId]),
  issuedAt: tt.date,
  // TODO: Check if this uid could be collapsed to id
  uid: Uid,
});
export type Session = t.TypeOf<typeof Session>;
