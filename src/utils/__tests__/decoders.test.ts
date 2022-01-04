import * as assert from "assert";
import * as d from "../decoders";
import * as E from "fp-ts/Either";

const validUrl = "http://0.0.0.0:8000/";
const invalidUrl = "invalid";

describe("urlFromStringDecoder", () => {
  describe("decode", () => {
    it("should return right given an valid url", () => {
      const T = d.urlFromStringDecoder;
      assert.deepStrictEqual(T.decode(validUrl), E.right(new URL(validUrl)));
    });
    it("should return left given an invalid url", () => {
      const T = d.urlFromStringDecoder;
      assert.equal(E.isLeft(T.decode(invalidUrl)), true);
    });
  });
});
