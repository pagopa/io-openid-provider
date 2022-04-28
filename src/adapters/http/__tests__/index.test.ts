import express from "express";
import request from "supertest";
import { Client } from "../../../domain/clients/types";
import { makeInMemoryApplication } from "./fakes";

// initialize the implicit flow
const initImplicitFlow = (app: express.Application, client: Client) => {
  return request(app)
    .get("/oauth/authorize")
    .query({
      client_id: client.clientId,
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

    const interactionId = authorizeRedirectResponse.headers["location"].replace(
      "/interaction/",
      ""
    );

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
});
