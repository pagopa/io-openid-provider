import * as t from "io-ts";
import { Option } from "fp-ts/Option";
import { TaskEither } from "fp-ts/TaskEither";
import { DomainError } from "../types";
import { Client, ClientId, OrganizationId, ServiceId } from "./types";

export const ClientSelector = t.type({
  organizationId: t.union([OrganizationId, t.undefined]),
  serviceId: t.union([ServiceId, t.undefined]),
});
export type ClientSelector = t.TypeOf<typeof ClientSelector>;

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
  /**
   * Given a selector return a list of Client that match the selector
   */
  readonly list: (
    selector: ClientSelector
  ) => TaskEither<DomainError, ReadonlyArray<Client>>;
}
