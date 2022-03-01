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
    const authenticateFn = mockIdentityService.authenticate.mockReturnValue(
      TE.right(records.validIdentity)
    );

    const { consentResponse, authorizeRedirectResponse } =
      await phonies.doAuthorizeRequestUntilConsent(app, clientSkipConsent);
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

  it("should render the consent page", async () => {
    const { client, mockIdentityService, app } = phonies.makeFakeApplication();
    const authenticateFn = mockIdentityService.authenticate.mockReturnValue(
      TE.right(records.validIdentity)
    );

    const { authorizeRedirectResponse, consentResponse } =
      await phonies.doAuthorizeRequestUntilConsent(app, client);

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
