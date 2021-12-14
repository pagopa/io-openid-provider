import * as router from "../router";
import * as records from "../../__tests__/utils/records";
import * as responses from "@pagopa/ts-commons/lib/responses";

describe("getInfoEndpointHandler", () => {
  it("should return the correct info", async () => {
    const actual = await router.getInfoEndpointHandler(records.validConfig)();
    const expected = responses.ResponseSuccessJson(records.validConfig.info);

    // TODO: Find a better way to define this assert, e.g. with one expect
    expect(actual.kind).toStrictEqual(expected.kind);
    expect(actual).toMatchObject({ value: expected.value });
  });
});
