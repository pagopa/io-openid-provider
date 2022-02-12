import * as oidc from "oidc-provider";
import * as f from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import * as u from "../userinfo";
import * as p from "./providerAdapters";

interface ConsumeInput {
  readonly prompt: oidc.PromptDetail;
  readonly params: oidc.UnknownObject;
  readonly uid: string;
  readonly session?: {
    readonly accountId: string;
  };
}

const authenticate =
  (userInfoClient: u.UserInfoClient) => (token: u.FederationToken) =>
    // find the user given the token
    f.pipe(
      userInfoClient.findUserByFederationToken(token),
      TE.bimap(
        (_) => p.unauthorizedInteractionResult,
        (_) => p.makeInteractionResult(token)
      ),
      TE.toUnion
    );

const confirm =
  (provider: oidc.Provider) =>
  ({ params, session, prompt }: ConsumeInput) =>
    f.pipe(
      O.fromNullable(session),
      TE.fromOption(f.constant(new Error("no session found"))),
      TE.map(
        (s) =>
          new provider.Grant({
            accountId: s.accountId,
            // TODO: Remove the cast
            clientId: params.client_id as string,
          })
      ),
      TE.map((grant) => {
        // TODO: Remove this cast
        const missingScopes =
          (prompt.details.missingOIDCScope as ReadonlyArray<string>) || [];
        grant.addOIDCScope(missingScopes.join(" "));
        return grant;
      }),
      TE.chain((grant) => TE.tryCatch(() => grant.save(), E.toError)),
      TE.bimap(
        () => p.unauthorizedInteractionResult,
        (grantId) => ({
          consent: {
            grantId,
          },
        })
      ),
      TE.toUnion
    );

export { ConsumeInput, confirm, authenticate };
