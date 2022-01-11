import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as D from "io-ts/Decoder";
import { flow, pipe, unsafeCoerce, constant } from "fp-ts/lib/function";

const makeUrl = E.tryCatchK(
  (str: string) => new URL(str),
  (_) => new Error("Invalid url")
);
const UrlFromString: D.Decoder<string, URL> = {
  decode: (str) =>
    pipe(
      makeUrl(str),
      E.mapLeft((err) => D.error(str, err.message))
    ),
};

const option = <A, B>(
  decoder: D.Decoder<A, B>
): D.Decoder<undefined | A, O.Option<B>> => ({
  decode: flow(
    O.fromPredicate((_) => _ !== undefined),
    O.map((_) => decoder.decode(unsafeCoerce(_))),
    O.fold(constant(E.right(O.none)), flow(E.map(O.some)))
  ),
});

export { option, UrlFromString };
