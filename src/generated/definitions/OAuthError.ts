/**
 * Do not edit this file it is auto-generated by io-utils / gen-api-models.
 * See https://github.com/pagopa/io-utils
 */
/* eslint-disable  */

import * as t from "io-ts";

// required attributes
const OAuthErrorR = t.interface({
  error: t.string
});

// optional attributes
const OAuthErrorO = t.partial({
  error_description: t.string
});

export const OAuthError = t.intersection(
  [OAuthErrorR, OAuthErrorO],
  "OAuthError"
);

export type OAuthError = t.TypeOf<typeof OAuthError>;
