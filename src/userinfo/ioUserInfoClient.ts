import * as TE from "fp-ts/lib/TaskEither";
import * as f from "fp-ts/function";
import nodeFetch from "node-fetch";
import * as authClient from "../generated/clients/io-auth/client";
import { UserIdentity } from "../generated/clients/io-auth/UserIdentity";
import { Client, createClient } from "../generated/clients/io-auth/client";
import * as I from ".";

const toError = (type: I.ErrorType): I.UserInfoClientError => ({
  errorType: type,
});

const makeUserInfo = (identity: UserIdentity): I.UserInfo => ({
  familyName: identity.family_name,
  fiscalCode: identity.fiscal_code,
  name: identity.name,
});

const getUserInfoFromIOBackend =
  (client: authClient.Client) => (federationToken: I.FederationToken) =>
    f.pipe(
      TE.tryCatch(
        () => client.getUserIdentity({ Bearer: `Bearer ${federationToken}` }), // FIXME Here you have to write Bearer as well (or find another way to tell the client that)
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

const makeIOBackendClient = (
  baseUrl: string,
  fetchApi: typeof fetch = nodeFetch as unknown as typeof fetch
): Client =>
  createClient({
    baseUrl,
    fetchApi,
  });

export { makeIOUserInfoClient, makeIOBackendClient };
