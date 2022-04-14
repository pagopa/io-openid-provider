import * as t from "io-ts";
import * as tt from "io-ts-types";
import { IdentityId } from "../../identities/types";

interface LoginRequestIdBrand {
  readonly LoginRequestId: unique symbol;
}
// LoginRequestId is just a string
export const LoginRequestId = t.brand(
  t.string,
  (s): s is t.Branded<string, LoginRequestIdBrand> => t.string.is(s),
  "LoginRequestId"
);
export type LoginRequestId = t.TypeOf<typeof LoginRequestId>;

export const LoginRequest = t.type({
  expireAt: tt.date,
  id: LoginRequestId,
  identity: t.union([t.undefined, IdentityId]),
  issuedAt: tt.date,
  kind: t.literal("LoginRequest"),
});
export type LoginRequest = t.TypeOf<typeof LoginRequest>;
