import { Option } from "fp-ts/Option";
import { TaskEither } from "fp-ts/TaskEither";
import { DomainError } from "../types";
import { ConsentRequest, ConsentRequestId } from "./types";

/**
 * Represents the only entry point that is allowed to work with the ConsentRequest storage
 */
export interface ConsentRequestService {
  /** Return the ConsentRequest identified by the given id */
  readonly find: (
    id: ConsentRequestId
  ) => TaskEither<DomainError, Option<ConsentRequest>>;
  /** Delete a ConsentRequest identifier by the given id */
  readonly remove: (id: ConsentRequestId) => TaskEither<DomainError, void>;
  /** Update or insert a ConsentRequest */
  readonly upsert: (
    item: ConsentRequest
  ) => TaskEither<DomainError, ConsentRequest>;
}
