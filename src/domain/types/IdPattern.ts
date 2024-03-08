import * as t from "io-ts";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings.js";

export const IdPattern = NonEmptyString;
export type IdPattern = t.TypeOf<typeof IdPattern>;
