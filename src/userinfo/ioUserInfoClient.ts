import * as TE from "fp-ts/lib/TaskEither";
import * as f from "fp-ts/function";
import * as authClient from "../generated/clients/io-auth/client";
import { UserIdentity } from "../generated/clients/io-auth/UserIdentity";
import * as I from ".";

const toError = (type: I.ErrorType): I.UserInfoClientError => ({
  errorType: type,
});

const makeUserInfo = (identity: UserIdentity): I.UserInfo => ({
  id: identity.fiscal_code,
});

const getUserInfoFromIOBackend =
  (client: authClient.Client) => (federationToken: I.FederationToken) =>
    f.pipe(
      TE.tryCatch(
        () => client.getUserIdentity({ Bearer: federationToken }),
        () => toError("unknown")
      )
    );

const findUserBySession =
  (client: authClient.Client) =>
  (
    federationToken: I.FederationToken
  ): TE.TaskEither<I.UserInfoClientError, I.UserInfo> =>
    f.pipe(
      federationToken,
      getUserInfoFromIOBackend(client),
      TE.chainW(
        f.flow(
          TE.fromEither,
          TE.mapLeft((_) => toError("decoding"))
        )
      ),
      TE.chain((response) => {
        switch (response.status) {
          case 200:
            return TE.right(response.value);
          case 400:
            return TE.left(toError("badRequest"));
          case 401:
            return TE.left(toError("invalidToken"));
          case 500:
            return TE.left(toError("unknown"));
          default:
            return TE.left(toError("unknown"));
        }
      }),
      TE.map(makeUserInfo)
    );

const makeIOUserInfoClient = (client: authClient.Client): I.UserInfoClient => ({
  findUserByFederationToken: findUserBySession(client),
});

export { makeIOUserInfoClient };
