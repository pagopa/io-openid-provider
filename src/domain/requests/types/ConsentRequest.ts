import * as t from "io-ts";
import * as tt from "io-ts-types";

interface ConsentRequestIdBrand {
  readonly ConsentRequestId: unique symbol;
}
// ConsentRequestId is just a string
export const ConsentRequestId = t.brand(
  t.string,
  (s): s is t.Branded<string, ConsentRequestIdBrand> => t.string.is(s),
  "ConsentRequestId"
);
export type ConsentRequestId = t.TypeOf<typeof ConsentRequestId>;

export const Grant = t.type({
  scope: t.string,
});
export type Grant = t.TypeOf<typeof Grant>;

export const ConsentRequest = t.type({
  expireAt: tt.date,
  grant: t.union([t.undefined, Grant]),
  id: ConsentRequestId,
  issuedAt: tt.date,
});
export type ConsentRequest = t.TypeOf<typeof ConsentRequest>;
