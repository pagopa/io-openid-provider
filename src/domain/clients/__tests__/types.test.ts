import { describe, it, expect } from "vitest";

import * as fc from "fast-check";
import * as E from "fp-ts/lib/Either.js";
import { client } from "./data";
import * as d from "../types";

describe("Client.props.clientId", () => {
  const clientIdType = d.Client.props.clientId;
  describe("encode", () => {
    it("should encode without error", () => {
      expect(clientIdType.encode(client.clientId)).toStrictEqual(
        `${client.clientId.organizationId}:${client.clientId.serviceId}`
      );
    });
  });
  describe("decode", () => {
    it("should return right given a valid value", () => {
      const valid = `${client.clientId.organizationId}:${client.clientId.serviceId}`;
      expect(clientIdType.decode(valid)).toStrictEqual(
        E.right(client.clientId)
      );
    });
    it("should return left given an invalid value", () => {
      const inputGen = fc.oneof(
        fc.string(),
        fc.string().map((s) => fc.constantFrom(`${s}:`, `:${s}`))
      );
      fc.assert(
        fc.property(inputGen, (input) => {
          expect(E.isLeft(clientIdType.decode(input))).toStrictEqual(true);
        })
      );
    });
  });
});
