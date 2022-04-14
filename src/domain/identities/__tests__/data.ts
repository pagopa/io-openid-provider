import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { Identity, IdentityId } from "../types";

export const identity: Identity = {
  familyName: "FamilyName",
  fiscalCode: "FISCALCODE" as NonEmptyString,
  givenName: "GivenName",
  id: "identity-id" as IdentityId,
};
