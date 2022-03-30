import * as fc from "fast-check";
import { getArbitrary } from "fast-check-io-ts";
import { GrantPayload } from "../grantAdapter";

export const grantPayloadArbitrary = getArbitrary(GrantPayload);
export const grantPayload = fc.sample(grantPayloadArbitrary, 1)[0];
