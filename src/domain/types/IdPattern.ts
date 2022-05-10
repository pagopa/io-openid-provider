import * as t from "io-ts";
import { PatternString } from "@pagopa/ts-commons/lib/strings";

export const IdPattern = PatternString("[a-zA-Z0-9]+");
export type IdPattern = t.TypeOf<typeof IdPattern>;
