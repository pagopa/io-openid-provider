import * as O from "fp-ts/Option";
import * as index from "../.";
import * as records from "../../__tests__/utils/records";

describe("makeAccountClaims", () => {
  it("should map properties", async () => {
    const user = records.validIdentity;
    const expected = user;
    const actual = index.makeAccountClaims(user);

    expect(actual.sub).toStrictEqual(expected.fiscalCode);
    expect(actual.family_name).toStrictEqual(expected.familyName);
    expect(actual.given_name).toStrictEqual(expected.givenName);
  });
});

describe("defaultConfiguration", () => {
  it("should provide the given adapter", () => {
    // just to match the adapter factory type
    const adapter = (_: string) => ({} as any);

    expect(index.defaultConfiguration(adapter).adapter).not.toStrictEqual(
      undefined
    );
  });
});

describe("makeAuthorizationHeader", () => {
  it("should return the correct value", () => {
    // just to match the adapter factory type
    const adapter = (_: string) => ({} as any);
    const config = index.defaultConfiguration(adapter);
    const config1 = { ...config, routes: undefined };
    const config2 = { ...config, routes: { registration: undefined } };
    const route = config.routes?.registration;
    expect(index.makeAuthorizationHeader(config, `${route}/123`)).toStrictEqual(
      O.some("Bearer 123")
    );
    expect(index.makeAuthorizationHeader(config, `${route}`)).toStrictEqual(
      O.none
    );
    expect(
      index.makeAuthorizationHeader(config, "/another/path")
    ).toStrictEqual(O.none);
    expect(
      index.makeAuthorizationHeader(config1, `${route}/123`)
    ).toStrictEqual(O.none);
    expect(
      index.makeAuthorizationHeader(config2, `${route}/123`)
    ).toStrictEqual(O.none);
  });
});
