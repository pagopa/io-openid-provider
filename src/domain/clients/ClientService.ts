import { Option } from "fp-ts/Option";
import { TaskEither } from "fp-ts/TaskEither";
import { DomainError } from "../types";
import { Client, ClientId } from "./types";

/**
 * Represents the only entry point that is allowed to work with the Client storage
 */
export interface ClientService {
  /**
   * Given a clientId return the client.
   */
  readonly find: (
    clientId: ClientId
  ) => TaskEither<DomainError, Option<Client>>;
  /**
   * Given a Client create or update it.
   */
  readonly upsert: (client: Client) => TaskEither<DomainError, Client>;
  /**
   * Delete the Client identified with the given clientId.
   */
  readonly remove: (clientId: ClientId) => TaskEither<DomainError, void>;
}
