import { Option } from "fp-ts/Option";
import * as TE from "fp-ts/TaskEither";
import { DomainError, Grant, GrantId } from "../domain";

/**
 * Represents the only entry point that is allowed to work with the Grant storage
 */
export interface GrantRepository {
  /**
   * Given a grant create or update it.
   */
  readonly upsert: (grant: Grant) => TE.TaskEither<DomainError, Grant>;
  /**
   * Return the grant identfied with the given id.
   */
  readonly find: (id: GrantId) => TE.TaskEither<DomainError, Option<Grant>>;
}
