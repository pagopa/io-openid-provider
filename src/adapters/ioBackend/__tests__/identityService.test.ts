import each from "jest-each";
import * as mock from "jest-mock-extended";
import * as t from "io-ts";
import * as E from "fp-ts/Either";
import { UserIdentity } from "../../../generated/clients/io-auth/UserIdentity";
import * as authClient from "../../../generated/clients/io-auth/client";
import { FiscalCode } from "@pagopa/ts-commons/lib/strings";
import { identity as fakeIdentity } from "../../../domain/identities/__tests__/data";
import { makeDomainError, DomainErrorTypes } from "../../../domain/types";
import { makeIdentityService } from "../identityService";
import { Logger } from "../../../domain/logger";

const identity = { ...fakeIdentity, id: fakeIdentity.fiscalCode };

const userIdentity: UserIdentity = {
  name: identity.givenName,
  family_name: identity.familyName,
  fiscal_code: identity.fiscalCode as unknown as FiscalCode,
  date_of_birth: new Date(),
};

const mkResponse = (status: number) => (value: unknown) =>
  Promise.resolve(
    t.success({
      status: status,
      headers: { "Content-Type": "application/json" },
      value: value,
    })
  );

const makeIdentityServiceTest = () => {
  const logger = mock.mock<Logger>();
  const mockAuthClient = mock.mock<authClient.Client>();
  const identityService = makeIdentityService(logger, mockAuthClient);
  return { identityService, mockAuthClient };
};

describe("IdentityService", () => {
  describe("authenticate", () => {
    const records = [
      {
        title: "return a user info",
        input: {
          token: "this-is-the-token",
        },
        responses: {
          getUserIdentityResp: mkResponse(200)(userIdentity),
        },
        expected: E.right(identity),
      },
      {
        title: "manage unknown error",
        input: {
          token: "this-is-the-token",
        },
        responses: {
          getUserIdentityResp: Promise.reject("don't care"),
        },
        expected: E.left(
          makeDomainError("Unexpected", DomainErrorTypes.GENERIC_ERROR)
        ),
      },
      {
        title: "return invalid token error given a 401 response",
        input: {
          token: "this-is-the-token",
        },
        responses: {
          getUserIdentityResp: mkResponse(401)(userIdentity),
        },
        expected: E.left(
          makeDomainError("401", DomainErrorTypes.GENERIC_ERROR)
        ),
      },
      {
        title: "return bad request error given a 400 response",
        input: {
          token: "this-is-the-token",
        },
        responses: {
          getUserIdentityResp: mkResponse(400)(userIdentity),
        },
        expected: E.left(
          makeDomainError("400", DomainErrorTypes.GENERIC_ERROR)
        ),
      },
      {
        title: "return unknown error given a 501 response",
        input: {
          token: "this-is-the-token",
        },
        responses: {
          getUserIdentityResp: mkResponse(501)(userIdentity),
        },
        expected: E.left(
          makeDomainError("Bad Request", DomainErrorTypes.GENERIC_ERROR)
        ),
      },
    ];

    each(records).it(
      "should $title",
      async ({ input, responses, expected }) => {
        const { identityService, mockAuthClient } = makeIdentityServiceTest();
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
