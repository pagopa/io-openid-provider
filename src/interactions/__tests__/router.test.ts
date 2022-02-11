import * as express from "express";
import * as oidc from "oidc-provider";
import * as TE from "fp-ts/TaskEither";
import * as records from "../../__tests__/utils/records";
import * as phonies from "../../__tests__/utils/phonies";
import * as _ from "../router";

describe("authenticate", () => {
  it("should return unauthorized - given no token", async () => {
    const mockUserInfoClient = phonies.makeMockUserInfoClient();
    const request = { cookies: {} } as express.Request;
    const actual = await _.authenticate(mockUserInfoClient)(request)();
    const expected = { error: "unauthorized" };
    expect(actual).toStrictEqual(expected);
    expect(mockUserInfoClient.findUserByFederationToken).toBeCalledTimes(0);
  });
  it("should return unauthorized - given invalid token", async () => {
    const mockUserInfoClient = phonies.makeMockUserInfoClient();
    const request = {
      cookies: {
        "X-IO-Federation-Token": "hello",
      },
    } as express.Request;
    mockUserInfoClient.findUserByFederationToken.mockReturnValue(
      TE.left({ errorType: "decoding" })
    );
    const actual = await _.authenticate(mockUserInfoClient)(request)();
    const expected = { error: "unauthorized" };
    expect(actual).toStrictEqual(expected);
    expect(mockUserInfoClient.findUserByFederationToken).toBeCalledTimes(1);
  });
  it("should return valid accountId - given a valid token", async () => {
    const mockUserInfoClient = phonies.makeMockUserInfoClient();
    const request = {
      cookies: {
        "X-IO-Federation-Token": "hello",
      },
    } as express.Request;
    mockUserInfoClient.findUserByFederationToken.mockReturnValue(
      TE.right(records.validUserInfo)
    );
    const actual = await _.authenticate(mockUserInfoClient)(request)();
    const expected = {
      login: { accountId: request.cookies["X-IO-Federation-Token"] },
    };
    expect(actual).toStrictEqual(expected);
    expect(mockUserInfoClient.findUserByFederationToken).toBeCalledTimes(1);
  });
});

describe("confirm", () => {
  it("should return a valid grant identifier", async () => {
    const provider = new oidc.Provider("http://localhost");
    const input = records.interaction.consent;

    const actual = await _.confirm(provider)(input)();

    const grant = await provider.Grant.find(actual.consent?.grantId || "");

    expect(grant).not.toStrictEqual(undefined);
  });
});
