import * as fc from "fast-check";
import { getArbitrary } from "fast-check-io-ts";
import { Client } from "../domain";

export const clientArbitrary = getArbitrary(Client);

export const client: Client = fc.sample(clientArbitrary, 1)[0];
