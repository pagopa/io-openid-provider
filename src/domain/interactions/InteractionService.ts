import { Option } from "fp-ts/lib/Option.js";
import { TaskEither } from "fp-ts/lib/TaskEither.js";
import { DomainError } from "../types/index.js";
import { Interaction, InteractionId } from "./types.js";

/**
 * Represents the only entry point that is allowed to work with the Interaction storage
 */
export interface InteractionService {
  /** Return the Interaction identified by the given id */
  readonly find: (
    id: InteractionId
  ) => TaskEither<DomainError, Option<Interaction>>;
  /** Delete a Interaction identifier by the given id */
  readonly remove: (id: InteractionId) => TaskEither<DomainError, void>;
  /** Update or insert a Interaction */
  readonly upsert: (item: Interaction) => TaskEither<DomainError, Interaction>;
}
