import request from "supertest";
import * as TE from "fp-ts/TaskEither";
import * as records from "../../__tests__/utils/records";
import * as phonies from "../../__tests__/utils/phonies";

describe("Router", () => {
  beforeEach(() => {
    // just a workaround to remove log on tests
    // TODO: Move this on some configuration (jest??)
    jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.spyOn(console, "info").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  it("should generate an id_token given an client with skip consent", async () => {
    const { clientSkipConsent, mockIdentityService, app } =
      phonies.makeFakeApplication();
    const authenticationCookie = "X-IO-Federation-Token=12345667";
    const authenticateFn = mockIdentityService.authenticate.mockReturnValue(
      TE.right(records.validIdentity)
    );

    // initialize the implicit flow
    const authorizeResponse = await phonies.doAuthorizeRequest(
      app,
      clientSkipConsent
    );
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
    const consentFollowRedirect = await request(app)
      // we need to wrap into a URL because the location is absolut in this response
      .get(new URL(consentResponse.headers["location"]).pathname)
      .set("cookie", authorizeRedirectResponse.headers["set-cookie"])
      .send();

    expect(consentFollowRedirect.statusCode).toBe(200);
    expect(consentFollowRedirect.text).toContain(
      '<input type="hidden" name="id_token"'
    );
    // TODO: Check why it is called 3 times!
    expect(authenticateFn).toBeCalledTimes(3);
  });

  it("should abort the authorization request", async () => {
    const { client, app } = phonies.makeFakeApplication();

    const authorize = await phonies.doAuthorizeRequest(app, client);
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
