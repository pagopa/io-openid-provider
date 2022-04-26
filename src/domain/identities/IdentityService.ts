import { TaskEither } from "fp-ts/TaskEither";
import { DomainError } from "../types";
import { AccessToken, Identity } from "./types";

/**
 * The service that manage the identities, an Identity is something that
 * coud be authenticated (e.g.: Users).
 */
export interface IdentityService {
  /**
   * Try to authenticate given an AccessToken
   *
   * @param accessToken: The token used to authenticate.
   * @returns A TaskEither filled with an error or a authenticated Identity.
   */
  readonly authenticate: (
    accessToken: AccessToken
  ) => TaskEither<DomainError, Identity>;
}
