import * as oidc from "oidc-provider";

export const clientPayload = {
  application_type: "web" as "web",
  grant_types: ["implicit"],
  id_token_signed_response_alg: "RS256" as oidc.AsymmetricSigningAlgorithm,
  post_logout_redirect_uris: [],
  require_auth_time: false,
  response_types: ["id_token" as oidc.ResponseType],
  subject_type: "public" as oidc.SubjectTypes,
  token_endpoint_auth_method: "none" as oidc.ClientAuthMethod,
  client_id_issued_at: 1649177205,
  client_id: "lVbSPt9cAghS_zBbLqcgZ",
  client_name: "This is the name of this client",
  redirect_uris: ["https://callback.io/callback"],
  scope: "profile openid",
  organization_id: "my-org",
  service_id: "my-service",
  bypass_consent: false,
  client_secret: undefined,
};

export const grantPayload = {
  accountId: "t-a]bZ",
  clientId: '} X"',
  exp: 1649169289,
  iat: 1649169489,
  jti: "y,STEj=!pi",
  openid: {
    scope: "z|h^v",
  },
};

export const sessionPayload = {
  iat: 1648822805,
  exp: 1648822969,
  accountId: "1234",
  loginTs: 1648822805,
  uid: "V0kJS3teGmL7YrdW8SRaJ",
  kind: "Session",
  jti: "OaqbTetDQVPglPcgP6vZz",
};

export const interactionPayload = {
  iat: 1648736314,
  exp: 1648736614,
  grantId: undefined,
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
