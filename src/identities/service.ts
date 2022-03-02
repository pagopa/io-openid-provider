import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";
import * as authClient from "../generated/clients/io-auth/client";
import { FederationToken, Identity, IdentityServiceErrorType } from "./domain";
import * as domain from "./domain";

const authenticate = (client: authClient.Client) => (token: FederationToken) =>
  pipe(
    TE.tryCatch(
      () => client.getUserIdentity({ Bearer: `Bearer ${token}` }),
      (_) => IdentityServiceErrorType.otherError
    ),
    TE.chainEitherK(
      flow(E.mapLeft((_) => IdentityServiceErrorType.decodingError))
    ),
    TE.chainEitherK((response) => {
      switch (response.status) {
        case 200:
          return E.right(domain.makeIdentity(response.value));
        case 400:
          return E.left(IdentityServiceErrorType.badRequest);
        case 401:
          return E.left(IdentityServiceErrorType.invalidToken);
        case 500:
        default:
          return E.left(IdentityServiceErrorType.otherError);
      }
    })
  );

/**
 * The service that manage the identities, an Identity is something that
 * coud be authenticated (e.g.: Users).
 */
interface IdentityService {
  /**
   * Try to authenticate given a FederationToken
   *
   * @param federationToken: The token used to authenticate.
   * @returns A TaskEither filled with an error or a authenticated Identity.
   */
  readonly authenticate: (
    federationToken: FederationToken
  ) => TE.TaskEither<IdentityServiceErrorType, Identity>;
}

/**
 * Create an instance of IdentityService from a io AuthClient
 */
const makeService = (client: authClient.Client): IdentityService => ({
  authenticate: authenticate(client),
});

export { FederationToken, IdentityService, makeService };
