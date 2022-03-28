import * as TE from "fp-ts/TaskEither";
import {
  DomainError,
  RegistrationAccessToken,
  RegistrationAccessTokenId,
} from "../domain";

/**
 * Define the only entry point to manage with RegistrationAccessToken
 * storage
 */
export interface RegistrationAccessTokenRepository {
  /** Remove the entity identified with the given id */
  readonly remove: (
    id: RegistrationAccessTokenId
  ) => TE.TaskEither<DomainError, void>;
  /** Insert the entity or update if doens't exist */
  readonly upsert: (
    item: RegistrationAccessToken
  ) => TE.TaskEither<DomainError, RegistrationAccessToken>;
  /** Return the entity identified with the given id */
  readonly find: (
    id: RegistrationAccessTokenId
  ) => TE.TaskEither<DomainError, RegistrationAccessToken | undefined>;
}
