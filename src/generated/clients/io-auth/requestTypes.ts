// DO NOT EDIT THIS FILE
// This file has been generated by gen-api-models
// eslint-disable sonar/max-union-size
// eslint-disable sonarjs/no-identical-functions

import * as t from "io-ts";

import * as r from "@pagopa/ts-commons/lib/requests.js";

import { FIMSUser } from "./FIMSUser.js";

import { ProblemJson } from "./ProblemJson.js";

/****************************************************************
 * getUserForFIMS
 */

// Request type definition
export type GetUserForFIMST = r.IGetApiRequestType<
  { readonly Bearer: string },
  "Authorization",
  never,
  | r.IResponseType<200, FIMSUser, never>
  | r.IResponseType<400, ProblemJson, never>
  | r.IResponseType<401, undefined, never>
  | r.IResponseType<404, ProblemJson, never>
  | r.IResponseType<429, undefined, never>
  | r.IResponseType<500, ProblemJson, never>
>;

export const getUserForFIMSDefaultResponses = {
  200: FIMSUser,
  400: ProblemJson,
  401: t.undefined,
  404: ProblemJson,
  429: t.undefined,
  500: ProblemJson,
};

export type GetUserForFIMSResponsesT<
  A0 = FIMSUser,
  C0 = FIMSUser,
  A1 = ProblemJson,
  C1 = ProblemJson,
  A2 = undefined,
  C2 = undefined,
  A3 = ProblemJson,
  C3 = ProblemJson,
  A4 = undefined,
  C4 = undefined,
  A5 = ProblemJson,
  C5 = ProblemJson
> = {
  200: t.Type<A0, C0>;
  400: t.Type<A1, C1>;
  401: t.Type<A2, C2>;
  404: t.Type<A3, C3>;
  429: t.Type<A4, C4>;
  500: t.Type<A5, C5>;
};

export function getUserForFIMSDecoder<
  A0 = FIMSUser,
  C0 = FIMSUser,
  A1 = ProblemJson,
  C1 = ProblemJson,
  A2 = undefined,
  C2 = undefined,
  A3 = ProblemJson,
  C3 = ProblemJson,
  A4 = undefined,
  C4 = undefined,
  A5 = ProblemJson,
  C5 = ProblemJson
>(
  overrideTypes:
    | Partial<
        GetUserForFIMSResponsesT<A0, C0, A1, C1, A2, C2, A3, C3, A4, C4, A5, C5>
      >
    | t.Type<A0, C0>
    | undefined = {}
): r.ResponseDecoder<
  | r.IResponseType<200, A0, never>
  | r.IResponseType<400, A1, never>
  | r.IResponseType<401, A2, never>
  | r.IResponseType<404, A3, never>
  | r.IResponseType<429, A4, never>
  | r.IResponseType<500, A5, never>
> {
  const isDecoder = (d: any): d is t.Type<A0, C0> =>
    typeof d["_A"] !== "undefined";

  const type = {
    ...(getUserForFIMSDefaultResponses as unknown as GetUserForFIMSResponsesT<
      A0,
      C0,
      A1,
      C1,
      A2,
      C2,
      A3,
      C3,
      A4,
      C4,
      A5,
      C5
    >),
    ...(isDecoder(overrideTypes) ? { 200: overrideTypes } : overrideTypes),
  };

  const d200 = (
    type[200].name === "undefined"
      ? r.constantResponseDecoder<undefined, 200, never>(200, undefined)
      : r.ioResponseDecoder<
          200,
          typeof type[200]["_A"],
          typeof type[200]["_O"],
          never
        >(200, type[200])
  ) as r.ResponseDecoder<r.IResponseType<200, A0, never>>;

  const d400 = (
    type[400].name === "undefined"
      ? r.constantResponseDecoder<undefined, 400, never>(400, undefined)
      : r.ioResponseDecoder<
          400,
          typeof type[400]["_A"],
          typeof type[400]["_O"],
          never
        >(400, type[400])
  ) as r.ResponseDecoder<r.IResponseType<400, A1, never>>;

  const d401 = (
    type[401].name === "undefined"
      ? r.constantResponseDecoder<undefined, 401, never>(401, undefined)
      : r.ioResponseDecoder<
          401,
          typeof type[401]["_A"],
          typeof type[401]["_O"],
          never
        >(401, type[401])
  ) as r.ResponseDecoder<r.IResponseType<401, A2, never>>;

  const d404 = (
    type[404].name === "undefined"
      ? r.constantResponseDecoder<undefined, 404, never>(404, undefined)
      : r.ioResponseDecoder<
          404,
          typeof type[404]["_A"],
          typeof type[404]["_O"],
          never
        >(404, type[404])
  ) as r.ResponseDecoder<r.IResponseType<404, A3, never>>;

  const d429 = (
    type[429].name === "undefined"
      ? r.constantResponseDecoder<undefined, 429, never>(429, undefined)
      : r.ioResponseDecoder<
          429,
          typeof type[429]["_A"],
          typeof type[429]["_O"],
          never
        >(429, type[429])
  ) as r.ResponseDecoder<r.IResponseType<429, A4, never>>;

  const d500 = (
    type[500].name === "undefined"
      ? r.constantResponseDecoder<undefined, 500, never>(500, undefined)
      : r.ioResponseDecoder<
          500,
          typeof type[500]["_A"],
          typeof type[500]["_O"],
          never
        >(500, type[500])
  ) as r.ResponseDecoder<r.IResponseType<500, A5, never>>;

  return r.composeResponseDecoders(
    r.composeResponseDecoders(
      r.composeResponseDecoders(
        r.composeResponseDecoders(r.composeResponseDecoders(d200, d400), d401),
        d404
      ),
      d429
    ),
    d500
  );
}

// Decodes the success response with the type defined in the specs
export const getUserForFIMSDefaultDecoder = () => getUserForFIMSDecoder();
