import { Option } from "fp-ts/Option";
import { TaskEither } from "fp-ts/TaskEither";
import { DomainError, Interaction, InteractionId } from "../domain";

/**
 * Represents the only entry point that is allowed to work with the Interaction storage
 */
export interface InteractionRepository {
  /**
   * Given an interaction create or update it.
   */
  readonly upsert: (grant: Interaction) => TaskEither<DomainError, Interaction>;
  /**
   * Delete the Interaction identified with the given id.
   */
  readonly remove: (id: InteractionId) => TaskEither<DomainError, void>;
  /**
   * Return the interaction identified with the given id.
   */
  readonly find: (
    id: InteractionId
  ) => TaskEither<DomainError, Option<Interaction>>;
}
