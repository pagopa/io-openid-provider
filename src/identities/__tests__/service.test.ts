import each from "jest-each";
import * as t from "io-ts";
import * as E from "fp-ts/Either";
import * as data from "../../__tests__/utils/records";
import * as phonies from "../../__tests__/utils/phonies";
import { IdentityServiceErrorType } from "../domain";

const mkResponse = (status: number) => (value: unknown) =>
  Promise.resolve(
    t.success({
      status: status,
      headers: { "Content-Type": "application/json" },
      value: value,
    })
  );

describe("IdentityService", () => {
  describe("authenticate", () => {
    const records = [
      {
        title: "return a user info",
        input: {
          token: "this-is-the-token",
        },
        responses: {
          getUserIdentityResp: mkResponse(200)(data.validUserIdentity),
        },
        expected: E.right(data.validIdentity),
      },
      {
        title: "manage unknown error",
        input: {
          token: "this-is-the-token",
        },
        responses: {
          getUserIdentityResp: Promise.reject("don't care"),
        },
        expected: E.left(IdentityServiceErrorType.otherError),
      },
      {
        title: "return invalid token error given a 401 response",
        input: {
          token: "this-is-the-token",
        },
        responses: {
          getUserIdentityResp: mkResponse(401)(data.validUserIdentity),
        },
        expected: E.left(IdentityServiceErrorType.invalidToken),
      },
      {
        title: "return bad request error given a 400 response",
        input: {
          token: "this-is-the-token",
        },
        responses: {
          getUserIdentityResp: mkResponse(400)(data.validUserIdentity),
        },
        expected: E.left(IdentityServiceErrorType.badRequest),
      },
      {
        title: "return unknown error given a 501 response",
        input: {
          token: "this-is-the-token",
        },
        responses: {
          getUserIdentityResp: mkResponse(501)(data.validUserIdentity),
        },
        expected: E.left(IdentityServiceErrorType.otherError),
      },
    ];

    each(records).it(
      "should $title",
      async ({ input, responses, expected }) => {
        const { identityService, mockAuthClient } =
          phonies.makeIdentityService();
        const { token } = input;
        const { getUserIdentityResp } = responses;

        const functionRecorded =
          mockAuthClient.getUserIdentity.mockReturnValueOnce(
            getUserIdentityResp
          );

        const actual = await identityService.authenticate(token)();

        expect(functionRecorded).toHaveBeenCalledWith({
          Bearer: `Bearer ${token}`,
        });
        expect(functionRecorded).toHaveBeenCalledTimes(1);
        expect(actual).toEqual(expected);
      }
    );
  });
});
