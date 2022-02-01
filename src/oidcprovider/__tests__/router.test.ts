import express from "express";
import * as records from "../../__tests__/utils/records";
import * as phonies from "../../__tests__/utils/phonies";
import * as O from "fp-ts/Option";
import * as TE from "fp-ts/TaskEither";
import request from "supertest";
import * as router from "../router";

// this method is useful if you need to return a subset
// of the available mocks
const makeFakeApplication = () => phonies.makeFakeApplication();

describe("extractIOFederationToken", () => {
  it("should return None if the given cookie doens't exists", () => {
    const request = {
      cookies: {},
    } as express.Request;
    const actual = router.extractIOFederationToken(request);
    const expected = O.none;
    expect(actual).toBe(expected);
  });
  it("should return the value of the given cookie", () => {
    const cookieValue = "hello";
    const request = {
      cookies: { "X-IO-Federation-Token": cookieValue },
    } as express.Request;
    const actual = router.extractIOFederationToken(request);
    const expected = O.some(cookieValue);
    expect(actual).toStrictEqual(expected);
  });
});

describe("interactionLogic", () => {
  it("should return an unauthorized response", async () => {
    const detail = records.loginPromptDetail;
    const mockUserInfoClient = phonies.makeMockUserInfoClient();
    const request = {
      cookies: {},
    } as express.Request;
    const actual = await router.interactionLogic(
      mockUserInfoClient,
      request,
      detail
    )();
    const expected = O.some({ error: "unauthorized" });
    expect(actual).toStrictEqual(expected);
  });
  it("should return a valid account", async () => {
    const cookieValue = "hello";
    const detail = records.loginPromptDetail;
    const mockUserInfoClient = phonies.makeMockUserInfoClient();
    mockUserInfoClient.findUserByFederationToken.mockReturnValue(
      TE.right(records.validUserInfo)
    );
    const request = {
      cookies: { "X-IO-Federation-Token": cookieValue },
    } as express.Request;
    const actual = await router.interactionLogic(
      mockUserInfoClient,
      request,
      detail
    )();
    const expected = O.some({ login: { accountId: cookieValue } });
    expect(actual).toStrictEqual(expected);
  });
  it("should None if the step is not login", async () => {
    const cookieValue = "hello";
    const detail = records.consentPromptDetail;
    const mockUserInfoClient = phonies.makeMockUserInfoClient();
    const request = {
      cookies: { "X-IO-Federation-Token": cookieValue },
    } as express.Request;
    const actual = await router.interactionLogic(
      mockUserInfoClient,
      request,
      detail
    )();
    const expected = O.none;
    expect(actual).toStrictEqual(expected);
  });
});

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
