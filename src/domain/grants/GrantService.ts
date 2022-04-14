import { Option } from "fp-ts/Option";
import { TaskEither } from "fp-ts/TaskEither";
import { DomainError } from "../types";
import { Grant, GrantSubjects, GrantId } from "./types";

/**
 * Represents the only entry point that is allowed to work with the Grant storage
 */
export interface GrantService {
  /**
   * Given a grantId return the grant.
   */
  readonly find: (grantId: GrantId) => TaskEither<DomainError, Option<Grant>>;
  /**
   * Given a grantId return the grant.
   */
  readonly findBySubjects: (
    subjects: GrantSubjects
  ) => TaskEither<DomainError, Option<Grant>>;
  /**
   * Given a Grant create or update it.
   */
  readonly upsert: (grant: Grant) => TaskEither<DomainError, Grant>;
  /**
   * Delete the Grant identified with the given grantId.
   */
  readonly remove: (grantId: GrantId) => TaskEither<DomainError, void>;
}
