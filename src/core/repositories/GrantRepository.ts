import { Option } from "fp-ts/Option";
import { TaskEither } from "fp-ts/TaskEither";
import { AccountId, ClientId, DomainError, Grant, GrantId } from "../domain";

/**
 * Represents the only entry point that is allowed to work with the Grant storage
 */
export interface GrantRepository {
  /**
   * Given a grant create or update it.
   */
  readonly upsert: (grant: Grant) => TaskEither<DomainError, Grant>;
  /**
   * Return the grant identified with the given id.
   */
  readonly find: (id: GrantId) => TaskEither<DomainError, Option<Grant>>;
  /**
   * Return the grant the user identified with AccountId required to remember
   * for the client identified with ClientId.
   */
  readonly findRemember: (
    clientId: ClientId,
    accountId: AccountId
  ) => TaskEither<DomainError, Option<Grant>>;
}
