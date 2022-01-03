import * as TE from "fp-ts/TaskEither";
import * as S from "../userinfo";

const makeConstUserInfoClient = (): S.UserInfoClient => ({
  findUserByFederationToken: (id: string) => TE.right({ id }),
});

export { makeConstUserInfoClient };
