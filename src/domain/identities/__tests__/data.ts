import { EmailString, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { Identity, IdentityId } from "../types";

export const identity: Identity = {
  acr: "acr value",
  authTime: new Date(),
  dateOfBirth: new Date(),
  email: "asdru.riot@email.com" as EmailString,
  familyName: "Asdrubale",
  fiscalCode: "TMMEXQ60A10Y526X" as NonEmptyString,
  givenName: "Roitek",
  id: "TMMEXQ60A10Y526X" as IdentityId,
};
