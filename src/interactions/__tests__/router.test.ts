import request from "supertest";
import * as phonies from "../../__tests__/utils/phonies";

describe("Router", () => {
  beforeEach(() => {
    // just a workaround to remove log on tests
    // TODO: Move this on some configuration (jest??)
    jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.spyOn(console, "info").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  it("should abort the authorization request", async () => {
    const { client, app } = phonies.makeFakeApplication();

    const authorize = await request(app)
      .get("/oauth/authorize")
      .query({
        client_id: client.client_id,
        response_type: (client.response_types || [""])[0],
        redirect_uri: (client.redirect_uris || [""])[0],
        scope: client.scope || "openid",
        state: "af0ijs",
        nonce: "n-0s6",
      });
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
