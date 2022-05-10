import express from "express";
import request from "supertest";
import { Client } from "../../../domain/clients/types";
import { grant } from "../../../domain/grants/__tests__/data";
import { makeInMemoryApplication } from "./fakes";

// initialize the implicit flow
const initImplicitFlow = (app: express.Application, client: Client) => {
  return request(app)
    .get("/oauth/authorize")
    .query({
      client_id: Client.props.clientId.encode(client.clientId),
      response_type: (client.responseTypes || [""])[0],
      redirect_uri: (client.redirectUris || [""])[0],
      response_mode: "form_post",
      scope: client.scope || "openid",
      state: "af0ijs",
      nonce: "n-0s6",
    });
};

// confirm the consent
const confirmConsent = (
  app: express.Application,
  interactionId: string,
  cookies: ReadonlyArray<string>
) => {
  return request(app)
    .post(`/interaction/${interactionId}/confirm`)
    .set("Cookie", cookies.concat())
    .type("form")
    .send({
      to_remember: "false",
    });
};

// follow redirect given a request with location header
const followRedirect = (
  app: express.Application,
  requestWithLocation: request.Response,
  cookies: ReadonlyArray<string>
) => {
  const urlString = requestWithLocation.headers["location"] || "";
  const url = urlString.startsWith("http")
    ? new URL(urlString).pathname
    : urlString;
  return request(app).get(url).set("Cookie", cookies.concat()).send();
};

describe("Application", () => {
  it("should implement the implicit flow", async () => {
    const { app, client } = makeInMemoryApplication();
    const authenticationCookie = "X-IO-Federation-Token=1234567";

    // start the implicit flow
    const authorizeResponse = await initImplicitFlow(app, client);
    const authorizeResponseCookies = [
      ...Array.from<string>(authorizeResponse.headers["set-cookie"] || []),
      authenticationCookie,
    ];
    // follow the redirect and perform the login
    const loginResponse = await followRedirect(
      app,
      authorizeResponse,
      authorizeResponseCookies
    );
    // follow the redirect of loginResponse (the flow land you to /oauth/authorize/:interaction-id)
    const authorizeRedirectResponse = await followRedirect(
      app,
      loginResponse,
      authorizeResponseCookies
    );
    const authorizeRedirectResponseCookies = [
      ...Array.from<string>(
        authorizeRedirectResponse.headers["set-cookie"] || []
      ),
      authenticationCookie,
    ];
    // follow the redirect of authorizeRedirectResponse
    const consentResponse = await followRedirect(
      app,
      authorizeRedirectResponse,
      authorizeRedirectResponseCookies
    );

    const interactionId = authorizeRedirectResponse.headers[
      "location"
    ]?.replace("/interaction/", "");

    const confirmConsentResponse = await confirmConsent(
      app,
      interactionId,
      authorizeRedirectResponseCookies
    );

    const confirmConsentFollowRedirect = await followRedirect(
      app,
      confirmConsentResponse,
      authorizeRedirectResponseCookies
    );

    expect(authorizeResponse.statusCode).toBe(303);
    expect(loginResponse.statusCode).toBe(303);
    expect(authorizeRedirectResponse.statusCode).toBe(303);
    expect(consentResponse.statusCode).toBe(200);
    expect(confirmConsentResponse.statusCode).toBe(303);
    expect(consentResponse.statusCode).toBe(200);
    expect(confirmConsentFollowRedirect.text).toContain(
      '<input type="hidden" name="id_token"'
    );
  });
  it("should implement the create client endpoint", async () => {
    const { app } = makeInMemoryApplication();

    const createClientResponse = await request(app)
      .post(`/admin/clients`)
      .send({
        redirect_uris: ["https://callback.io/callback"],
        organization_id: "00000000001",
        service_id: "my-service-1",
        response_types: ["id_token"],
        grant_types: ["implicit"],
        application_type: "web",
        client_name: "This is the name of this client",
        scope: "profile openid",
        token_endpoint_auth_method: "none",
      });

    expect(createClientResponse.statusCode).toBe(201);
    expect(createClientResponse.body.client_id).toBe(
      `00000000001:my-service-1`
    );
  });
  it("should implement the find client endpoint", async () => {
    const { app, client } = makeInMemoryApplication();
    const clientId = Client.props.clientId.encode(client.clientId);

    const findClientResponse = await request(app)
      .get(`/admin/clients/${clientId}`)
      .send();

    expect(findClientResponse.statusCode).toBe(200);
    expect(findClientResponse.body.client_id).toBe(`${clientId}`);
  });
  it("should implement the discovery endpoint", async () => {
    const { app } = makeInMemoryApplication();

    const discoveryResponse = await request(app)
      .get(`/.well-known/openid-configuration`)
      .send();

    expect(discoveryResponse.statusCode).toBe(200);
    expect(discoveryResponse.body).not.toContain("token_endpoint");
    expect(discoveryResponse.body.scopes_supported).toStrictEqual([
      "openid",
      "acr",
      "auth_time",
      "date_of_birth",
      "email_verified",
      "family_name",
      "given_name",
      "name",
      "profile",
      "sub",
    ]);
  });
  it("should implement the grant detail endpoint", async () => {
    const { app } = makeInMemoryApplication([{ ...grant, remember: true }]);
    const { organizationId, serviceId } = grant.subjects.clientId;

    const findGrantResponse = await request(app)
      .get(`/admin/grants/${organizationId}/${serviceId}`)
      .set({ identityId: grant.subjects.identityId })
      .send();

    expect(findGrantResponse.statusCode).toBe(200);
    expect(findGrantResponse.body.id).toBe(`${grant.id}`);
  });
});
