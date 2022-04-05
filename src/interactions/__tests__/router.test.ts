import express from "express";
import request from "supertest";
import * as oidc from "oidc-provider";
import * as TE from "fp-ts/TaskEither";
import * as records from "../../__tests__/utils/records";
import * as phonies from "../../__tests__/utils/phonies";
import { IdentityServiceErrorType } from "../../identities/domain";

// initialize the implicit flow
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

// follow redirect given a request with location header
const followRedirect = (
  app: express.Application,
  requestWithLocation: request.Response,
  cookies: ReadonlyArray<string>
) => {
  const urlString = requestWithLocation.headers["location"];
  const url = urlString.startsWith("http")
    ? new URL(urlString).pathname
    : urlString;
  return request(app).get(url).set("Cookie", cookies.concat()).send();
};

describe("Router", () => {
  beforeEach(() => {
    // just a workaround to remove log on tests
    // TODO: Move this on some configuration (jest??)
    jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.spyOn(console, "info").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  it("should generate an id_token given a client with skip consent", async () => {
    const { clientSkipConsent, mockIdentityService, app } =
      phonies.makeFakeApplication();
    const authenticationCookie = "X-IO-Federation-Token=12345667";
    const authenticateFn = mockIdentityService.authenticate.mockReturnValue(
      TE.right(records.validIdentity)
    );

    // initialize the implicit flow
    const authorizeResponse = await doAuthorizeRequest(app, clientSkipConsent);
    const authorizeResponseCookies = [
      ...Array.from<string>(authorizeResponse.headers["set-cookie"]),
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
      ...Array.from<string>(authorizeRedirectResponse.headers["set-cookie"]),
      authenticationCookie,
    ];
    // follow the redirect of authorizeRedirectResponse
    const consentResponse = await followRedirect(
      app,
      authorizeRedirectResponse,
      authorizeRedirectResponseCookies
    );

    const consentFollowRedirect = await followRedirect(
      app,
      consentResponse,
      authorizeRedirectResponseCookies
    );

    expect(consentFollowRedirect.statusCode).toBe(200);
    expect(consentFollowRedirect.text).toContain(
      '<input type="hidden" name="id_token"'
    );
    // TODO: Check why it is called 3 times!
    expect(authenticateFn).toBeCalledTimes(3);
  });

  it("should create a session with the correct accountId", async () => {
    const { client, mockIdentityService, provider, app } =
      phonies.makeFakeApplication();
    const authenticationCookie = "X-IO-Federation-Token=12345667";
    mockIdentityService.authenticate.mockReturnValue(
      TE.right(records.validIdentity)
    );

    // initialize the implicit flow
    const authorizeResponse = await doAuthorizeRequest(app, client);
    const authorizeResponseCookies = [
      ...Array.from<string>(authorizeResponse.headers["set-cookie"]),
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
      ...Array.from<string>(authorizeRedirectResponse.headers["set-cookie"]),
    ];

    // very nasty ... but works
    const sessionPrefix = "_session=";
    const sessionId = authorizeRedirectResponseCookies
      .flatMap((value) => value.split("; "))
      .filter((value) => value.startsWith(sessionPrefix))
      .map((value) => value.replace(sessionPrefix, ""))
      .join("");

    const session = await provider.Session.find(sessionId);

    expect(session).toMatchObject({
      accountId: records.validIdentity.fiscalCode,
    });
  });

  it("should render the consent page", async () => {
    const { client, mockIdentityService, app } = phonies.makeFakeApplication();
    const authenticationCookie = "X-IO-Federation-Token=12345667";
    const authenticateFn = mockIdentityService.authenticate.mockReturnValue(
      TE.right(records.validIdentity)
    );

    // initialize the implicit flow
    const authorizeResponse = await doAuthorizeRequest(app, client);
    const authorizeResponseCookies = [
      ...Array.from<string>(authorizeResponse.headers["set-cookie"]),
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
      ...Array.from<string>(authorizeRedirectResponse.headers["set-cookie"]),
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

    expect(consentResponse.statusCode).toBe(200);
    expect(consentResponse.text).toContain(
      `"/interaction/${interactionId}/confirm"`
    );
    expect(consentResponse.text).toContain(
      `"/interaction/${interactionId}/abort"`
    );
    expect(authenticateFn).toBeCalledTimes(2);
  });

  it("should return error when authorize return error", async () => {
    const { mockIdentityService, client, app } = phonies.makeFakeApplication();
    const authenticationCookie = "X-IO-Federation-Token=12345667";
    const authenticateFn = mockIdentityService.authenticate.mockReturnValueOnce(
      TE.left(IdentityServiceErrorType.invalidToken)
    );

    // initialize the implicit flow
    const authorizeResponse = await doAuthorizeRequest(app, client);
    const authorizeResponseCookies = [
      ...Array.from<string>(authorizeResponse.headers["set-cookie"]),
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

    expect(authorizeRedirectResponse.statusCode).toBe(400);
    expect(authorizeRedirectResponse.text).toContain(
      '<input type="hidden" name="error" value="access_denied"'
    );
    expect(authenticateFn).toBeCalledTimes(1);
  });

  it("should abort the authorization request", async () => {
    const { client, app } = phonies.makeFakeApplication();

    const authorize = await doAuthorizeRequest(app, client);
    const interactionId = authorize.headers["location"].replace(
      "/interaction/",
      ""
    );

    const actual = await request(app)
      .get(`/interaction/${interactionId}/abort`)
      .set("cookie", authorize.headers["set-cookie"])
      .send();

    expect(authorize.statusCode).toBe(303);
    expect(actual.statusCode).toBe(303);
  });
});
