import request from "supertest";
import * as records from "../../__tests__/utils/records";
import * as phonies from "../../__tests__/utils/phonies";

// this method is useful if you need to return a subset
// of the available mocks
const makeFakeApplication = () => phonies.makeFakeApplication();

describe("/authorize", () => {
  it("should redirect to /interaction given a valid client", async () => {
    const [_mockUserInfo, app] = makeFakeApplication();
    const response = await request(app)
      .get("/oauth/authorize")
      .query({
        client_id: records.validEnv.TEST_CLIENT_ID,
        response_type: "id_token",
        redirect_uri: records.validEnv.TEST_CLIENT_REDIRECT_URI,
        scope: "openid",
        state: "af0ijs",
        nonce: "n-0s6",
      })
      .set("Cookie", ["X-IO-Federation-Token=12345667"]);
    expect(response.statusCode).toBe(303);
    expect(response.headers["location"]).toContain("/interaction/");
  });
});
