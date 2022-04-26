import { Option } from "fp-ts/Option";
import { TaskEither } from "fp-ts/TaskEither";
import { DomainError } from "../types";
import { Interaction, InteractionId } from "./types";

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
