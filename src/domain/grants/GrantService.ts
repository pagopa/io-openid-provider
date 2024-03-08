import { Option } from "fp-ts/lib/Option.js";
import { TaskEither } from "fp-ts/lib/TaskEither.js";
import { IdentityId } from "../identities/types.js";
import { DomainError } from "../types/index.js";
import { Grant, GrantId, GrantSelector } from "./types.js";

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
