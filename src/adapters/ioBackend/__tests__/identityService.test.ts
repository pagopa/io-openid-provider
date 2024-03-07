import { describe, it, expect, vi } from "vitest";

import * as t from "io-ts";
import * as E from "fp-ts/lib/Either.js";
import { FIMSUser } from "../../../generated/clients/io-auth/FIMSUser";
import { FiscalCode } from "@pagopa/ts-commons/lib/strings";
import { identity as fakeIdentity } from "../../../domain/identities/__tests__/data";
import {
  makeDomainError,
  DomainErrorTypes,
} from "../../../domain/types/index.js";
import { makeIdentityService } from "../identityService";
import { SpidLevelEnum } from "../../../generated/clients/io-auth/SpidLevel";

import { IResponseType } from "@pagopa/ts-commons/lib/requests";
import { AccessToken } from "../../../domain/identities/types";
import { makeLogger } from "../../winston";

const identity = { ...fakeIdentity, id: fakeIdentity.fiscalCode };

const userIdentity: FIMSUser = {
  acr: SpidLevelEnum["https://www.spid.gov.it/SpidL2"],
  auth_time: 1648474413,
  name: identity.givenName,
  family_name: identity.familyName,
  fiscal_code: identity.fiscalCode as unknown as FiscalCode,
  date_of_birth: new Date(),
};

const response = <S extends number, T>(
  status: S,
  value: T
): t.Validation<IResponseType<S, T>> =>
  t.success({
    status,
    headers: { "Content-Type": "application/json" },
    value,
  });

const mocks = {
  logger: makeLogger({ logLevel: "info", logName: "identityService.test" }),
};

describe("IdentityService", () => {
  describe("authenticate", () => {
    const records = [
      {
        title: "return a user info",
        input: {
          token: "this-is-the-token",
        },
        expected: E.right({
          ...identity,
          acr: SpidLevelEnum["https://www.spid.gov.it/SpidL2"],
          authTime: new Date("2022-03-28T13:33:33.000Z"),
          dateOfBirth: userIdentity.date_of_birth,
          email: userIdentity.email,
        }),
        getUserForFIMS: vi.fn().mockResolvedValue(response(200, userIdentity)),
      },
      {
        title: "manage unknown error",
        input: {
          token: "this-is-the-token",
        },
        expected: E.left(
          makeDomainError("Unexpected", DomainErrorTypes.GENERIC_ERROR)
        ),
        getUserForFIMS: vi.fn().mockRejectedValue("don't care!"),
      },
      {
        title: "return invalid token error given a 401 response",
        input: {
          token: "this-is-the-token",
        },
        expected: E.left(
          makeDomainError("401", DomainErrorTypes.GENERIC_ERROR)
        ),
        getUserForFIMS: vi.fn().mockResolvedValue(response(401, undefined)),
      },
      {
        title: "return bad request error given a 400 response",
        input: {
          token: "this-is-the-token",
        },
        expected: E.left(
          makeDomainError("400", DomainErrorTypes.GENERIC_ERROR)
        ),
        getUserForFIMS: vi.fn().mockResolvedValue(response(400, userIdentity)),
      },
      {
        title: "return unknown error given a 500 response",
        input: {
          token: "this-is-the-token",
        },
        expected: E.left(
          makeDomainError("Bad Request", DomainErrorTypes.GENERIC_ERROR)
        ),
        getUserForFIMS: vi.fn().mockResolvedValue(response(500, userIdentity)),
      },
    ];

    it.each(records)(
      "should $title",
      async ({ input, expected, getUserForFIMS }) => {
        const identityService = makeIdentityService(mocks.logger, {
          getUserForFIMS,
        });

        const tokenOrError = AccessToken.decode(input.token);

        if (E.isRight(tokenOrError)) {
          const actual = await identityService.authenticate(
            tokenOrError.right
          )();
          expect(getUserForFIMS).toHaveBeenCalledTimes(1);
          expect(getUserForFIMS).toHaveBeenCalledWith({
            Bearer: `Bearer ${tokenOrError.right}`,
          });
          expect(actual).toEqual(expected);
        }

        expect.hasAssertions();
      }
    );
  });
});
