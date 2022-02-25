import * as t from "io-ts";
import { FederationToken } from "../identities/domain";

// this type is a mapping of oidc.Interaction
// useful to improve typing
const CustomInteraction = t.intersection([
  t.type({
    params: t.type({
      client_id: t.string,
    }),
    prompt: t.type({
      details: t.partial({
        missingOIDCScope: t.readonlyArray(t.string),
      }),
      name: t.union([t.literal("login"), t.literal("consent")]),
    }),
  }),
  // this part is avaiable ony after the login phase
  // TODO: improve typing in the future, we can split this CustomInteraction
  // in two different interaction LoginInteraction and ConsentInteraction
  t.partial({
    session: t.type({
      accountId: t.string,
    }),
    uid: t.string,
  }),
]);
type CustomInteraction = t.TypeOf<typeof CustomInteraction>;

enum ErrorType {
  internalError = "internal_error",
  accessDenied = "access_denied",
  invalidClient = "invalid_client",
}

const CustomInteractionError = t.type({
  error: t.union([
    t.literal(ErrorType.internalError),
    t.literal(ErrorType.accessDenied),
    t.literal(ErrorType.invalidClient),
  ]),
});
type CustomInteractionError = t.TypeOf<typeof CustomInteractionError>;

// this type is a mapping of oidc.InteractionResult
// useful to improve typing
const CustomInteractionResult = t.union([
  t.type({
    login: t.type({
      accountId: FederationToken,
    }),
  }),
  t.type({
    consent: t.type({
      grantId: t.string,
    }),
  }),
  CustomInteractionError,
]);
type CustomInteractionResult = t.TypeOf<typeof CustomInteractionResult>;

const makeCustomInteractionError = (
  type: ErrorType
): CustomInteractionError => ({
  error: type,
});

export {
  CustomInteraction,
  CustomInteractionResult,
  ErrorType,
  makeCustomInteractionError,
};
