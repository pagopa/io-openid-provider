import * as fc from "fast-check";
import { getArbitrary } from "fast-check-io-ts";
import { Client, Grant } from "../domain";

export const clientArbitrary = getArbitrary(Client);
export const client: Client = fc.sample(clientArbitrary, 1)[0];

export const grantArbitrary = getArbitrary(Grant);
export const grant: Grant = fc.sample(grantArbitrary, 1)[0];
