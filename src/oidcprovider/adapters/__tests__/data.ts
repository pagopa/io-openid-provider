import * as fc from "fast-check";
import { getArbitrary } from "fast-check-io-ts";
import { GrantPayload } from "../grantAdapter";

export const grantPayloadArbitrary = getArbitrary(GrantPayload);
export const grantPayload = fc.sample(grantPayloadArbitrary, 1)[0];

export const interactionPayload = {
  iat: 1648736314,
  exp: 1648736614,
  returnTo: "http://localhost:3001/oauth/authorize/4xOhQpnqmwqwU_PZOgz4c",
  prompt: {
    name: "consent",
    reasons: ["op_scopes_missing"],
    details: {
      missingOIDCScope: ["openid"],
    },
  },
  lastSubmission: {
    login: {
      accountId: "1234",
    },
  },
  params: {
    client_id: "HkyhKaZfGfVbDN7fB4dqs",
    nonce: "<nonce>",
    redirect_uri: "https://callback.io/callback",
    response_type: "id_token",
    scope: "openid",
    state: "<state>",
  },
  session: {
    accountId: "1234",
    uid: "MJPuJwJJY68o54zwMFtsW",
    cookie: "dioBtP8emJD3xjt5jXNmE",
  },
  kind: "Interaction",
  jti: "4xOhQpnqmwqwU_PZOgz4c",
  result: {
    login: {
      accountId: "1234",
    },
    consent: {
      grantId: "9ursDgacXawrWSTLo1Po9SwmiuNrOQvmwG9eJxECJSm",
    },
  },
};
