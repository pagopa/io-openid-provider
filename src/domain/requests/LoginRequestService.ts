import { Option } from "fp-ts/Option";
import { TaskEither } from "fp-ts/TaskEither";
import { DomainError } from "../types";
import { LoginRequest, LoginRequestId } from "./types";

/**
 * Represents the only entry point that is allowed to work with the LoginRequest storage
 */
export interface LoginRequestService {
  /** Return the LoginRequest identified by the given id */
  readonly find: (
    id: LoginRequestId
  ) => TaskEither<DomainError, Option<LoginRequest>>;
  /** Delete a LoginRequest identifier by the given id */
  readonly remove: (id: LoginRequestId) => TaskEither<DomainError, void>;
  /** Update or insert a LoginRequest */
  readonly upsert: (
    item: LoginRequest
  ) => TaskEither<DomainError, LoginRequest>;
}
