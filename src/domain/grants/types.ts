import * as t from "io-ts";
import * as tt from "io-ts-types";
import { ClientId } from "../clients/types";
import { IdentityId } from "../identities/types";

interface GrantIdBrand {
  readonly GrantId: unique symbol;
}
// GrantId is just a string
export const GrantId = t.brand(
  t.string,
  (s): s is t.Branded<string, GrantIdBrand> => t.string.is(s),
  "GrantId"
);
export type GrantId = t.TypeOf<typeof GrantId>;

export const GrantSubjects = t.type({
  clientId: ClientId,
  identityId: IdentityId,
});
export type GrantSubjects = t.TypeOf<typeof GrantSubjects>;

export const Grant = t.type({
  expireAt: tt.date,
  id: GrantId,
  issuedAt: tt.date,
  remember: t.union([t.undefined, t.boolean]),
  scope: t.union([t.undefined, t.string]),
  subjects: GrantSubjects,
});
export type Grant = t.TypeOf<typeof Grant>;
