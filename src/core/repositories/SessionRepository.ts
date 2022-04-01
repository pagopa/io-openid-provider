import { Option } from "fp-ts/Option";
import * as TE from "fp-ts/TaskEither";
import { DomainError, Session, SessionId } from "../domain";

/**
 * Represents the only entry point that is allowed to work with the Session storage
 */
export interface SessionRepository {
  /**
   * Given a session create or update it.
   */
  readonly upsert: (entity: Session) => TE.TaskEither<DomainError, Session>;
  /**
   * Delete the session identified with the given id.
   */
  readonly remove: (id: SessionId) => TE.TaskEither<DomainError, void>;
  /**
   * Return the session identfied with the given id.
   */
  readonly find: (id: SessionId) => TE.TaskEither<DomainError, Option<Session>>;

  /**
   * Return the session identfied with the given uid.
   */
  readonly findByUid: (
    id: string
  ) => TE.TaskEither<DomainError, Option<Session>>;
}
