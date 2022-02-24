import * as strings from "@pagopa/ts-commons/lib/strings";
import * as t from "io-ts";

const FederationToken = strings.NonEmptyString;
type FederationToken = t.TypeOf<typeof FederationToken>;

const Identity = t.type({
  familyName: t.string,
  fiscalCode: t.string,
  givenName: t.string,
});
type Identity = t.TypeOf<typeof Identity>;

export { FederationToken, Identity };
