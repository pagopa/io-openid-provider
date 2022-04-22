import * as t from "io-ts";

interface SecondsBrand {
  readonly Seconds: unique symbol;
}

export const Seconds = t.brand(
  t.number,
  (s): s is t.Branded<number, SecondsBrand> => t.Int.is(s),
  "Seconds"
);
export type Seconds = t.TypeOf<typeof Seconds>;
