import * as TE from "fp-ts/TaskEither";
import { FederationToken, Identity } from "./domain";

interface IdentityService {
  readonly authenticate: (
    federationToken: FederationToken
  ) => TE.TaskEither<Error, Identity>;
}

const makeService = (): IdentityService => ({
  authenticate: (_) => TE.left(new Error("Error")),
});

export { FederationToken, IdentityService, makeService };
