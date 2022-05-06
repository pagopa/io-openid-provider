import { Option } from "fp-ts/Option";
import { TaskEither } from "fp-ts/TaskEither";
import { IdentityId } from "../identities/types";
import { DomainError } from "../types";
import { Grant, GrantId, GrantSelector } from "./types";

/**
 * Represents the only entry point that is allowed to work with the Grant storage
 */
export interface GrantService {
  /**
   * Given an identityId and a grantId return the grant.
   */
  readonly find: (
    identityId: IdentityId,
    grantId: GrantId
  ) => TaskEither<DomainError, Option<Grant>>;
  /**
   * Given a selector return grants that matches it
   */
  readonly findBy: (
    selector: GrantSelector
  ) => TaskEither<DomainError, ReadonlyArray<Grant>>;
  /**
   * Given a Grant create or update it.
   */
  readonly upsert: (grant: Grant) => TaskEither<DomainError, Grant>;
  /**
   * Delete the Grant identified with the given grantId.
   */
  readonly remove: (
    identityId: IdentityId,
    grantId: GrantId
  ) => TaskEither<DomainError, void>;
}
