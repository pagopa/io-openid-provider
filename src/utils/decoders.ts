import * as E from "fp-ts/Either";
import * as D from "io-ts/Decoder";
import { pipe } from "fp-ts/lib/function";

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

export { UrlFromString };
