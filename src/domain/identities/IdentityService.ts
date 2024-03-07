import { TaskEither } from "fp-ts/lib/TaskEither.js";
import { DomainError } from "../types/index.js";
import { AccessToken, Identity } from "./types.js";

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
