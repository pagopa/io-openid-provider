import * as index from "../.";
import * as records from "../../__tests__/utils/records";

describe("userInfoToAccount", () => {
  it("should map properties", async () => {
    const token = "token-value";
    const user = records.validIdentity;
    const expected = user;
    const actual = index.userInfoToAccount(token)(user);
    const actualClaims = await actual.claims("id_token", "profile", {}, []);

    expect(actual.accountId).toStrictEqual(token);
    expect(actualClaims.sub).toStrictEqual(expected.fiscalCode);
    expect(actualClaims.family_name).toStrictEqual(expected.familyName);
    expect(actualClaims.given_name).toStrictEqual(expected.givenName);
  });
});

describe("defaultConfiguration", () => {
  it("should provide an adapter", () => {
    const configuration = index.defaultConfiguration(records.validConfig);
    expect(configuration.adapter).not.toStrictEqual(undefined);
  });
});
