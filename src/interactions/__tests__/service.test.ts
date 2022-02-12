import * as oidc from "oidc-provider";
import * as TE from "fp-ts/TaskEither";
import * as records from "../../__tests__/utils/records";
import * as phonies from "../../__tests__/utils/phonies";
import * as _ from "../service";

describe("authenticate", () => {
  it("should return unauthorized - given invalid token", async () => {
    const mockUserInfoClient = phonies.makeMockUserInfoClient();
    const token = "token-value";
    mockUserInfoClient.findUserByFederationToken.mockReturnValue(
      TE.left({ errorType: "decoding" })
    );
    const actual = await _.authenticate(mockUserInfoClient)(token)();
    const expected = { error: "unauthorized" };
    expect(actual).toStrictEqual(expected);
    expect(mockUserInfoClient.findUserByFederationToken).toBeCalledTimes(1);
  });
  it("should return valid accountId - given a valid token", async () => {
    const mockUserInfoClient = phonies.makeMockUserInfoClient();
    const token = "token-value";
    mockUserInfoClient.findUserByFederationToken.mockReturnValue(
      TE.right(records.validUserInfo)
    );
    const actual = await _.authenticate(mockUserInfoClient)(token)();
    const expected = {
      login: { accountId: token },
    };
    expect(actual).toStrictEqual(expected);
    expect(mockUserInfoClient.findUserByFederationToken).toBeCalledTimes(1);
  });
});

describe("confirm", () => {
  it("should return a valid grant identifier with scopes filled correctly", async () => {
    const provider = new oidc.Provider("http://localhost");
    const missingOIDCScope = ["openid", "profile"];
    // Add some missing scopes to input
    const prompt = {
      ...records.interaction.consent.prompt,
      details: { missingOIDCScope },
    };
    const input = { ...records.interaction.consent, prompt };

    const actual = await _.confirm(provider)(input)();

    const grant = await provider.Grant.find(actual.consent?.grantId || "");

    expect(grant).not.toStrictEqual(undefined);
    expect(grant?.getOIDCScope()).toStrictEqual(missingOIDCScope.join(" "));
  });
});
