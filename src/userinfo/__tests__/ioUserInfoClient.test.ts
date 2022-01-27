import * as t from "io-ts";
import * as E from "fp-ts/Either";
import * as r from "../../__tests__/utils/records";
import * as p from "../../__tests__/utils/phonies";

const token = "token";

describe("makeIOUserInfoClient", () => {
  describe("findUserByFederationToken", () => {
    it("should return a user info", async () => {
      const { service, mockClient } = p.makeService();

      const functionRecorded = mockClient.getUserIdentity.mockReturnValueOnce(
        Promise.resolve(
          t.success({
            status: 200,
            headers: { "Content-Type": "application/json" },
            value: r.validUserIdentity,
          })
        )
      );

      const actual = await service.findUserByFederationToken(token)();
      const expected = E.right({ id: r.validUserIdentity.fiscal_code });

      expect(functionRecorded).toHaveBeenCalledWith({ Bearer: token });
      expect(actual).toEqual(expected);
    });
    it("should return an unknown error (e.g. connection error)", async () => {
      const { service, mockClient } = p.makeService();

      const functionRecorded = mockClient.getUserIdentity.mockReturnValueOnce(
        Promise.reject("don't care")
      );

      const actual = await service.findUserByFederationToken(token)();
      const expected = E.left(p.getExpectedError("unknown"));

      expect(functionRecorded).toHaveBeenCalledWith({ Bearer: token });
      expect(actual).toEqual(expected);
    });
    it("should return a 401 - invalid token", async () => {
      const { service, mockClient } = p.makeService();

      const functionRecorded = mockClient.getUserIdentity.mockReturnValueOnce(
        Promise.resolve(
          t.success({
            status: 401,
            headers: { "Content-Type": "application/json" },
            value: undefined,
          })
        )
      );

      const actual = await service.findUserByFederationToken(token)();
      const expected = E.left(p.getExpectedError("invalidToken"));

      expect(functionRecorded).toHaveBeenCalledWith({ Bearer: token });
      expect(actual).toEqual(expected);
    });
  });
});
