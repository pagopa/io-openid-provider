import * as t from "io-ts";
import * as strings from "@pagopa/ts-commons/lib/strings";
import { UserIdentity } from "src/generated/clients/io-auth/UserIdentity";

const FederationToken = strings.NonEmptyString;
type FederationToken = t.TypeOf<typeof FederationToken>;

const Identity = t.type({
  familyName: t.string,
  fiscalCode: t.string,
  givenName: t.string,
});
type Identity = t.TypeOf<typeof Identity>;

enum IdentityServiceErrorType {
  badRequest = "badRequest",
  decodingError = "decodingError",
  invalidToken = "invalidToken",
  otherError = "otherError",
}

const makeIdentity = (user: UserIdentity): Identity => ({
  familyName: user.family_name,
  fiscalCode: user.fiscal_code,
  givenName: user.name,
});

export { FederationToken, Identity, IdentityServiceErrorType, makeIdentity };
