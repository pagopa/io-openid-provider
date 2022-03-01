import request from "supertest";
import * as express from "express";
import * as mock from "jest-mock-extended";
import * as oidc from "oidc-provider";
import * as records from "./records";
import * as application from "../../application";
import * as logger from "../../logger";
import * as authClient from "../../generated/clients/io-auth/client";
import * as interactions from "../../interactions/service";
import * as identities from "../../identities/service";
import * as oidcprovider from "../../oidcprovider";

// Create a fake application used to run some test
// usually tests of routers, you need to mock the services,
// expect the provider
const makeFakeApplication = () => {
  const config = records.validConfig;
  const { client, clientSkipConsent, provider, mockIdentityService } =
    makeLocalProvider();
  const log = logger.makeLogger(config.logger);
  const mockProviderService = interactions.makeService(provider, log);
  // return an application with all mocked services
  const app = application.makeApplication(
    config,
    provider,
    mockProviderService,
    mockIdentityService,
    log
  );
  return {
    client,
    clientSkipConsent,
    mockProviderService,
    mockIdentityService,
    app,
  };
};

// Create a provider to use during tests.
// This provider use a in-memory database.
const makeLocalProvider = () => {
  const client: oidc.ClientMetadata = {
    client_id: "client-id",
    grant_types: ["implicit"],
    redirect_uris: ["https://callback/cb"],
    response_types: ["id_token"],
    token_endpoint_auth_method: "none",
  };
  const clientSkipConsent = {
    ...client,
    client_id: "client-skip-consent",
    bypass_consent: true,
  };
  const mockIdentityService = mock.mock<identities.IdentityService>();
  const overridenConfiguration = {
    ...oidcprovider.defaultConfiguration(records.validConfig),
    adapter: undefined,
    clients: [client, clientSkipConsent],
  };
  const provider = oidcprovider.makeProvider(
    records.validConfig,
    mockIdentityService,
    overridenConfiguration
  );
  return { provider, client, clientSkipConsent, mockIdentityService };
};

const doAuthorizeRequest = (
  app: express.Application,
  client: oidc.ClientMetadata
) => {
  return request(app)
    .get("/oauth/authorize")
    .query({
      client_id: client.client_id,
      response_type: (client.response_types || [""])[0],
      redirect_uri: (client.redirect_uris || [""])[0],
      response_mode: "form_post",
      scope: client.scope || "openid",
      state: "af0ijs",
      nonce: "n-0s6",
    });
};
const doAuthorizeRequestUntilConsent = async (
  app: express.Application,
  client: oidc.ClientMetadata
) => {
  const authenticationCookie = "X-IO-Federation-Token=12345667";
  // initialize the implicit flow
  const authorizeResponse = await doAuthorizeRequest(app, client);
  // follow the redirect and perform the login
  const loginResponse = await request(app)
    .get(authorizeResponse.headers["location"])
    .set("cookie", [
      ...authorizeResponse.headers["set-cookie"],
      authenticationCookie,
    ] as any)
    .send();
  // follow the redirect of loginResponse (the flow land you to /oauth/authorize/:interaction-id)
  const authorizeRedirectResponse = await request(app)
    // we need to wrap into a URL because the location is absolut in this response
    .get(new URL(loginResponse.headers["location"]).pathname)
    .set("cookie", [
      ...authorizeResponse.headers["set-cookie"],
      authenticationCookie,
    ] as any)
    .send();
  // follow the redirect of authorize towards consent step
  const consentResponse = await request(app)
    .get(authorizeRedirectResponse.headers["location"])
    .set("cookie", authorizeRedirectResponse.headers["set-cookie"])
    .send();
  return {
    authorizeResponse,
    loginResponse,
    authorizeRedirectResponse,
    consentResponse,
  };
};

const makeIdentityService = () => {
  const mockAuthClient = mock.mock<authClient.Client>();
  const identityService = identities.makeService(mockAuthClient);
  return { identityService, mockAuthClient };
};

export {
  makeFakeApplication,
  makeIdentityService,
  makeLocalProvider,
  doAuthorizeRequest,
  doAuthorizeRequestUntilConsent,
};
