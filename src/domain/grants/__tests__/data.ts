import { identity } from "../../identities/__tests__/data";
import { client } from "../../clients/__tests__/data";
import { Grant, GrantId } from "../types";

export const grant: Grant = {
  expireAt: new Date(),
  id: "grant-id" as GrantId,
  issuedAt: new Date(),
  remember: false,
  scope: client.scope,
  subjects: {
    clientId: client.clientId,
    identityId: identity.id,
  },
};
