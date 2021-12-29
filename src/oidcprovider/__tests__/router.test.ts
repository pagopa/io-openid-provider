import * as phonies from "../../__tests__/utils/phonies";
import request from "supertest";

// this method is useful if you need to return a subset
// of the available mocks
const makeFakeApplication = () => phonies.makeFakeApplication();

describe("test", () => {
  it("test", async () => {
    const [_mockUserInfo, app] = makeFakeApplication();
    const response = await request(app)
      .get("/oauth/authorize")
      .query({
        client_id: "foo",
        response_type: "id_token",
        redirect_uri: "https://client.example.org/cb",
        scope: "openid",
        state: "af0ijs",
        nonce: "n-0s6",
      })
      .set("Cookie", ["X-IO-Federation-Token=12345667"]);
    // TODO: this test is not complete
    expect(response.statusCode).toBe(303);
    expect(response.headers["location"]).toBe("");
  });
});
