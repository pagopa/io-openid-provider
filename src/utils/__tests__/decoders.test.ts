import * as t from "io-ts";
import * as assert from "assert";
import * as d from "../decoders";
import * as D from "io-ts/Decoder";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";

describe("asDecoder", () => {
  it("should return a decoder that return the same value of the original decoder on fail", () => {
    const decoder = d.asPureDecoder(t.string);

    assert.deepStrictEqual(decoder.decode(1), D.string.decode(1));
  });

  it("should return a decoder that return the same value of the original decoder on success", () => {
    const decoder = d.asPureDecoder(t.string);

    assert.deepStrictEqual(
      decoder.decode("test_string"),
      D.string.decode("test_string")
    );
  });
});

describe("urlFromStringDecoder", () => {
  describe("decode", () => {
    it("should return right given an valid url", () => {
      const validUrl = "http://0.0.0.0:8000/";
      const T = d.UrlFromString;
      assert.deepStrictEqual(T.decode(validUrl), E.right(new URL(validUrl)));
    });
    it("should return left given an invalid url", () => {
      const invalidUrl = "invalid";
      const T = d.UrlFromString;
      assert.equal(E.isLeft(T.decode(invalidUrl)), true);
    });
  });
});

describe("option", () => {
  describe("decode", () => {
    it("should return right given a value", () => {
      const value = "hello";
      const T = d.option(D.string);
      assert.deepStrictEqual(T.decode(value), E.right(O.some(value)));
    });
    it("should return right with none given undefined", () => {
      const value = undefined;
      const T = d.option(D.string);
      assert.deepStrictEqual(T.decode(value), E.right(O.none));
    });
    it("should return left given an invalid value", () => {
      const value = "";
      const T = d.option(D.number);
      assert.equal(E.isLeft(T.decode(value)), true);
    });
  });
});
