import * as TE from "fp-ts/TaskEither";
import { Client, DomainError } from "../domain";

export interface ClientRepository {
  readonly find: (
    client_id: string
  ) => TE.TaskEither<DomainError, Client | undefined>;
  readonly upsert: (client: Client) => TE.TaskEither<DomainError, Client>;
  readonly remove: (client_id: string) => TE.TaskEither<DomainError, void>;
}
