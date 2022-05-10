import { strings } from "@pagopa/ts-commons";
import * as tt from "io-ts-types";
import * as t from "io-ts";
import { EmailString } from "@pagopa/ts-commons/lib/strings";

interface AccessTokenBrand {
  readonly AccessToken: unique symbol;
}
// AccessToken is just a string
export const AccessToken = t.brand(
  t.string,
  (s): s is t.Branded<string, AccessTokenBrand> => t.string.is(s),
  "AccessToken"
);
export type AccessToken = t.TypeOf<typeof AccessToken>;

interface IdentityIdBrand {
  readonly IdentityId: unique symbol;
}
// IdentityId is just a string
export const IdentityId = t.brand(
  t.string,
  (s): s is t.Branded<string, IdentityIdBrand> => t.string.is(s),
  "IdentityId"
);
export type IdentityId = t.TypeOf<typeof IdentityId>;

export const Identity = t.type({
  acr: t.union([t.undefined, t.string]),
  authTime: t.union([t.undefined, tt.date]),
  dateOfBirth: t.union([t.undefined, tt.date]),
  email: t.union([t.undefined, EmailString]),
  familyName: t.string,
  fiscalCode: strings.NonEmptyString,
  givenName: t.string,
  id: IdentityId,
});
export type Identity = t.TypeOf<typeof Identity>;
