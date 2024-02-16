import * as t from "io-ts";
import * as E from "fp-ts/Either";
import { FIMSUser } from "../../../generated/clients/io-auth/FIMSUser";
import { FiscalCode } from "@pagopa/ts-commons/lib/strings";
import { identity as fakeIdentity } from "../../../domain/identities/__tests__/data";
import { makeDomainError, DomainErrorTypes } from "../../../domain/types";
import { SpidLevelEnum } from "../../../generated/clients/io-auth/SpidLevel";
import { mockAuthClient } from "../../../__mock__/auth";
import { identityServiceMock } from "../../../__mock__/identity";
import { describe, it, vi, beforeEach, expect } from "vitest";

beforeEach(() => vi.restoreAllMocks);

const identity = { ...fakeIdentity, id: fakeIdentity.fiscalCode };

const userIdentity: FIMSUser = {
  acr: SpidLevelEnum["https://www.spid.gov.it/SpidL2"],
  auth_time: 1648474413,
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
  return { identityServiceMock, mockAuthClient };
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
        expected: E.right({
          ...identity,
          acr: SpidLevelEnum["https://www.spid.gov.it/SpidL2"],
          authTime: new Date("2022-03-28T13:33:33.000Z"),
          dateOfBirth: userIdentity.date_of_birth,
          email: userIdentity.email,
        }),
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

    it.each(records)(
      "should $title",
      async ({ input, responses, expected }) => {
        const { identityServiceMock, mockAuthClient } =
          makeIdentityServiceTest();
        const { token } = input;
        const { getUserIdentityResp } = responses;
        console.log(getUserIdentityResp);

        const functionRecorded =
          mockAuthClient.getUserForFIMS.mockReturnValueOnce(
            getUserIdentityResp
          );

        const actual = await identityServiceMock.authenticate(token)();

        expect(functionRecorded).toHaveBeenCalledWith({
          Bearer: `Bearer ${token}`,
        });
        expect(functionRecorded).toHaveBeenCalledTimes(1);
        expect(actual).toEqual(expected);
      }
    );
  });
});
