import * as fc from "fast-check";
import { getArbitrary } from "fast-check-io-ts";
import { AccountId, Client, ClientId, Grant, GrantId } from "../domain";

export const clientArbitrary = getArbitrary(Client);
export const client: Client = fc.sample(clientArbitrary, 1)[0];

export const grant: Grant = {
  accountId: "account-id" as AccountId,
  clientId: "client-id" as ClientId,
  expireAt: new Date(),
  id: "grant-id" as GrantId,
  issuedAt: new Date(),
  scope: "openid profile",
};
