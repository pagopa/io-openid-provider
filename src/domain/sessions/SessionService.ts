import { Option } from "fp-ts/lib/Option.js";
import { TaskEither } from "fp-ts/lib/TaskEither.js";
import { DomainError } from "../types/index.js";
import { Session, SessionId, Uid } from "./types.js";

/**
 * Represents the only entry point that is allowed to work with the Session storage
 */
export interface SessionService {
  /**
   * Given a sessionId return the session.
   */
  readonly find: (
    sessionId: SessionId
  ) => TaskEither<DomainError, Option<Session>>;
  /**
   * Given a uid return the session.
   */
  readonly findByUid: (uid: Uid) => TaskEither<DomainError, Option<Session>>;
  /**
   * Given a Session create or update it.
   */
  readonly upsert: (session: Session) => TaskEither<DomainError, Session>;
  /**
   * Delete the Session identified with the given sessionId.
   */
  readonly remove: (sessionId: SessionId) => TaskEither<DomainError, void>;
}
