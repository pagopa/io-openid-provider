import { Option } from "fp-ts/Option";
import * as TE from "fp-ts/TaskEither";
import {
  DomainError,
  InteractionRequest,
  InteractionRequestId,
} from "../domain";

/**
 * Represents the only entry point that is allowed to work with the InteractionRequest storage
 */
export interface InteractionRequestRepository {
  /**
   * Given an interaction create or update it.
   */
  readonly upsert: (
    grant: InteractionRequest
  ) => TE.TaskEither<DomainError, InteractionRequest>;
  /**
   * Delete the InteractionRequest identified with the given id.
   */
  readonly remove: (
    id: InteractionRequestId
  ) => TE.TaskEither<DomainError, void>;
  /**
   * Return the interaction identfied with the given id.
   */
  readonly find: (
    id: InteractionRequestId
  ) => TE.TaskEither<DomainError, Option<InteractionRequest>>;
}
