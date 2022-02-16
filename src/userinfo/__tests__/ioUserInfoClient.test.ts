import each from "jest-each";
import * as t from "io-ts";
import * as E from "fp-ts/Either";
import * as r from "../../__tests__/utils/records";
import * as p from "../../__tests__/utils/phonies";

const mkResponse = (status: number) => (value: unknown) =>
  Promise.resolve(
    t.success({
      status: status,
      headers: { "Content-Type": "application/json" },
      value: value,
    })
  );

describe("makeIOUserInfoClient", () => {
  describe("findUserByFederationToken", () => {
    const records = [
      {
        title: "return a user info",
        input: {
          token: "this-is-the-token",
        },
        responses: {
          getUserIdentityResp: mkResponse(200)(r.validUserIdentity),
        },
        expected: E.right(r.validUserInfo),
      },
      {
        title: "manage unknown error",
        input: {
          token: "this-is-the-token",
        },
        responses: {
          getUserIdentityResp: Promise.reject("don't care"),
        },
        expected: E.left(p.getExpectedError("unknown")),
      },
      {
        title: "return invalid token error given a 401 response",
        input: {
          token: "this-is-the-token",
        },
        responses: {
          getUserIdentityResp: mkResponse(401)(r.validUserIdentity),
        },
        expected: E.left(p.getExpectedError("invalidToken")),
      },
      {
        title: "return bad request error given a 400 response",
        input: {
          token: "this-is-the-token",
        },
        responses: {
          getUserIdentityResp: mkResponse(400)(r.validUserIdentity),
        },
        expected: E.left(p.getExpectedError("badRequest")),
      },
      {
        title: "return unknown error given a 501 response",
        input: {
          token: "this-is-the-token",
        },
        responses: {
          getUserIdentityResp: mkResponse(501)(r.validUserIdentity),
        },
        expected: E.left(p.getExpectedError("unknown")),
      },
    ];

    each(records).it(
      "should $title",
      async ({ input, responses, expected }) => {
        const { service, mockClient } = p.makeService();
        const { token } = input;
        const { getUserIdentityResp } = responses;

        const functionRecorded =
          mockClient.getUserIdentity.mockReturnValueOnce(getUserIdentityResp);

        const actual = await service.findUserByFederationToken(token)();

        expect(functionRecorded).toHaveBeenCalledWith({
          Bearer: `Bearer ${token}`,
        });
        expect(functionRecorded).toHaveBeenCalledTimes(1);
        expect(actual).toEqual(expected);
      }
    );
  });
});
