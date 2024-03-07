import { describe, it, expect } from "vitest";

import * as middlewares from "../middlewares";
import { configuration } from "./data";

/* eslint-disable @typescript-eslint/no-explicit-any */
const makeCtx = (url: string): any => ({
  url,
  headers: {},
});
/* eslint-enable @typescript-eslint/no-explicit-any */

const nextFn = () => {
  return Promise.resolve({});
};

describe("disableAuthClientsEndpointMiddleware", () => {
  it("should set the authorization header with clientId", async () => {
    const clientId = "123";
    const ctx = makeCtx(`${configuration.routes?.registration}/${clientId}`);

    await middlewares.disableAuthClientsEndpointMiddleware(configuration)(
      ctx,
      nextFn
    );
    expect(ctx.headers.authorization).toBe(`Bearer ${clientId}`);
  });
  it("should keep authorization as it is", async () => {
    const newConfiguration = { ...configuration, routes: undefined };
    const ctx0 = makeCtx(`${configuration.routes?.registration}`);
    const ctx1 = makeCtx(`${configuration.routes?.registration}/`);
    const ctx2 = makeCtx(`/another/endpoint`);
    const ctx3 = makeCtx(`${configuration.routes?.registration}/123`);

    await middlewares.disableAuthClientsEndpointMiddleware(configuration)(
      ctx0,
      nextFn
    );
    expect(ctx0.headers.authorization).toBe(undefined);
    await middlewares.disableAuthClientsEndpointMiddleware(configuration)(
      ctx1,
      nextFn
    );
    expect(ctx1.headers.authorization).toBe(undefined);
    await middlewares.disableAuthClientsEndpointMiddleware(configuration)(
      ctx2,
      nextFn
    );
    expect(ctx2.headers.authorization).toBe(undefined);
    await middlewares.disableAuthClientsEndpointMiddleware(newConfiguration)(
      ctx3,
      nextFn
    );
    expect(ctx3.headers.authorization).toBe(undefined);
  });
});
