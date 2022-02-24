import * as t from "io-ts";
import * as TE from "fp-ts/TaskEither";
import * as strings from "@pagopa/ts-commons/lib/strings";

const FederationToken = strings.NonEmptyString;
type FederationToken = t.TypeOf<typeof FederationToken>;

const Identity = t.type({
  familyName: t.string,
  fiscalCode: t.string,
  givenName: t.string,
});
type Identity = t.TypeOf<typeof Identity>;

interface IdentityService {
  readonly authenticate: (
    federationToken: FederationToken
  ) => TE.TaskEither<Error, Identity>;
}

const makeService = (): IdentityService => ({
  authenticate: (_) => TE.left(new Error("Error")),
});

export { FederationToken, IdentityService, makeService };
