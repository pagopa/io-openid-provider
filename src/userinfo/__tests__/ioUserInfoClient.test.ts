import * as t from "io-ts";
import * as f from "fp-ts/function";
import * as E from "fp-ts/Either";
import * as S from "../ioUserInfoClient";
import * as mock from "jest-mock-extended";
import * as authClient from "../../generated/clients/io-auth/client";

// Move this one into phonies.ts
const makeService = () => {
  const mockClient = mock.mock<authClient.Client>();
  const service = S.makeIOUserInfoClient(mockClient);
  return f.tuple(service, mockClient);
};

// TODO: Move into records.ts
const validUserIdentity = {
  name: "Asdrubale",
  family_name: "Roitek",
  fiscal_code: "¯_(ツ)_/¯",
  date_of_birth: new Date(),
};

describe("makeIOUserInfoClient", () => {
  describe("findUserByFederationToken", () => {
    it("should return a user info", async () => {
      const token = "token";
      const [service, mockClient] = makeService();

      const functionRecorded = mockClient.getUserIdentity.mockReturnValueOnce(
        Promise.resolve(
          t.success({
            status: 200,
            headers: { "Content-Type": "application/json" },
            value: validUserIdentity,
          })
        )
      );

      const actual = await service.findUserByFederationToken(token)();
      const expected = E.right({ id: validUserIdentity.fiscal_code });

      expect(functionRecorded).toHaveBeenCalledWith({ Bearer: token });
      expect(actual).toEqual(expected);
    });
  });
});
