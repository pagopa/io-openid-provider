import * as t from "io-ts";
import * as TE from "fp-ts/TaskEither";

type FederationToken = string;

const UserInfo = t.type({
  id: t.string,
});
type UserInfo = t.TypeOf<typeof UserInfo>;

const ErrorType = t.keyof({
  badRequest: "bad request",
  decoding: "decoding",
  invalidToken: "session invalid or expired",
  unknown: "unknown",
});
type ErrorType = t.TypeOf<typeof ErrorType>;

const UserInfoClientError = t.type({
  errorType: ErrorType,
});
type UserInfoClientError = t.TypeOf<typeof UserInfoClientError>;

interface UserInfoClient {
  readonly findUserByFederationToken: (
    id: FederationToken
  ) => TE.TaskEither<UserInfoClientError, UserInfo>;
}

export {
  FederationToken,
  UserInfoClient,
  UserInfo,
  UserInfoClientError,
  ErrorType,
};
