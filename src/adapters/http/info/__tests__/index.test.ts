import { describe, it, expect } from "vitest";

import express from "express";
import request from "supertest";
import * as responses from "@pagopa/ts-commons/lib/responses";
import * as router from "../index";
import { config } from "../../../../__tests__/data";

describe("getInfoEndpointHandler", () => {
  it("should return the correct info", async () => {
    const actual = await router.getInfoEndpointHandler(config)();
    const expected = responses.ResponseSuccessJson(config.info);

    expect(actual).toMatchObject({
      value: expected.value,
      kind: expected.kind,
    });
  });
});

describe("makeRouter", () => {
  it("should return a workable router", async () => {
    const application = express().use(router.makeRouter(config));
    const actual = await request(application).get("/info");

    expect(actual.statusCode).toBe(200);
  });
});
