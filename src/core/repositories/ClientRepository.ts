import * as TE from "fp-ts/TaskEither";
import { Client, ClientId, DomainError } from "../domain";

/**
 * This interface represents the entry point to retrieve and manage
 * the Client entity from the repository
 */
export interface ClientRepository {
  /**
   * Given a clientId return the client.
   */
  readonly find: (
    clientId: ClientId
  ) => TE.TaskEither<DomainError, Client | undefined>;
  /**
   * Given a Client create or update it.
   */
  readonly upsert: (client: Client) => TE.TaskEither<DomainError, Client>;
  /**
   * Delete the Client identified with the given clientId.
   */
  readonly remove: (clientId: ClientId) => TE.TaskEither<DomainError, void>;
}
