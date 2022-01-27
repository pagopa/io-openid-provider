import * as TE from "fp-ts/TaskEither";
import * as S from "../userinfo";

const makeConstUserInfoClient = (): S.UserInfoClient => ({
  findUserByFederationToken: (id: string) =>
    TE.right({
      familyName: "Fake family name",
      fiscalCode: id,
      name: "Fake name",
    }),
});

export { makeConstUserInfoClient };
