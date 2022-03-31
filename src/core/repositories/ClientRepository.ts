import * as TE from "fp-ts/TaskEither";
import { Client, ClientId, DomainError, ClientSelector } from "../domain";

/**
 * Represents the only entry point that is allowed to work with the Client storage
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
  /**
   * Given a selector return a list of Client that match the selector
   */
  readonly list: (
    selector: ClientSelector
  ) => TE.TaskEither<DomainError, ReadonlyArray<Client>>;
}