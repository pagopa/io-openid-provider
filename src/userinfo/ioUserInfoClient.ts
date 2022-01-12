import * as TE from "fp-ts/lib/TaskEither";
import * as f from "fp-ts/function";
import * as authClient from "../generated/clients/io-auth/client";
import * as I from ".";

const error: I.UserInfoClientError = {
  errorType: "unknown",
};

// TODO: This method is not yet complete
const findUserBySession =
  (client: authClient.Client) =>
  (id: I.FederationToken): TE.TaskEither<I.UserInfoClientError, I.UserInfo> =>
    f.pipe(
      f.constant(client.getUserIdentity({ Bearer: id })),
      TE.fromTask,
      TE.chain(TE.fromEither),
      TE.mapLeft((_) => error),
      TE.chain((_) => {
        switch (_.status) {
          case 200:
            return TE.right(_.value);
          case 400:
            return TE.left(error);
          default:
            return TE.left(error);
        }
      }),
      TE.map((_) => ({ id: _.fiscal_code }))
    );

const makeIOUserInfoClient = (client: authClient.Client): I.UserInfoClient => ({
  findUserByFederationToken: findUserBySession(client),
});

export { makeIOUserInfoClient };
