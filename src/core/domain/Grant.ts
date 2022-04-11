import * as t from "io-ts";
import * as tt from "io-ts-types";
import { ClientId } from "./Client";

interface AccountIdBrand {
  readonly AccountId: unique symbol;
}
// AccountId is just a string, refinement is useful to avoid
// parameters switch
export const AccountId = t.brand(
  t.string,
  (s): s is t.Branded<string, AccountIdBrand> => t.string.is(s),
  "AccountId"
);
export type AccountId = t.TypeOf<typeof AccountId>;

interface GrantIdBrand {
  readonly GrantId: unique symbol;
}
// GrantId is just a string, refinement is useful to avoid
// parameters switch
export const GrantId = t.brand(
  t.string,
  (s): s is t.Branded<string, GrantIdBrand> => t.string.is(s),
  "GrantId"
);
export type GrantId = t.TypeOf<typeof GrantId>;

export const Grant = t.type({
  accountId: AccountId,
  clientId: ClientId,
  expireAt: tt.date,
  id: GrantId,
  issuedAt: tt.date,
  remember: t.boolean,
  scope: t.string,
});
export type Grant = t.TypeOf<typeof Grant>;
