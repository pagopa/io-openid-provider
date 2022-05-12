import * as t from "io-ts";
import * as tt from "io-ts-types";
import { Client } from "../clients/types";
import { IdentityId } from "../identities/types";
import { IdPattern } from "../types";

interface GrantIdBrand {
  readonly GrantId: unique symbol;
}
export const GrantId = t.brand(
  IdPattern,
  (s): s is t.Branded<IdPattern, GrantIdBrand> => IdPattern.is(s),
  "GrantId"
);
export type GrantId = t.TypeOf<typeof GrantId>;

export const GrantSubjects = t.type({
  clientId: Client.props.clientId,
  identityId: IdentityId,
});
export type GrantSubjects = t.TypeOf<typeof GrantSubjects>;

export const GrantSelector = t.type({
  clientId: tt.option(Client.props.clientId),
  identityId: IdentityId,
  remember: t.boolean,
});
export type GrantSelector = t.TypeOf<typeof GrantSelector>;

export const Grant = t.type({
  expireAt: tt.date,
  id: GrantId,
  issuedAt: tt.date,
  remember: t.union([t.undefined, t.boolean]),
  scope: t.string,
  subjects: GrantSubjects,
});
export type Grant = t.TypeOf<typeof Grant>;
