import * as t from "io-ts";
import * as TE from "fp-ts/TaskEither";

type FederationToken = string;

const UserInfo = t.type({
  id: t.string,
});
type UserInfo = t.TypeOf<typeof UserInfo>;

const UserInfoClientError = t.type({
  errorType: t.literal("unknown"),
});
type UserInfoClientError = t.TypeOf<typeof UserInfoClientError>;

interface UserInfoClient {
  readonly findUserByFederationToken: (
    id: FederationToken
  ) => TE.TaskEither<UserInfoClientError, UserInfo>;
}

export { FederationToken, UserInfoClient, UserInfo, UserInfoClientError };
