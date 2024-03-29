import * as t from "io-ts";
import * as tt from "io-ts-types";
import { Option } from "fp-ts/lib/Option.js";
import { TaskEither } from "fp-ts/lib/TaskEither.js";
import { DomainError } from "../types/index.js";
import { Client, ClientId, OrganizationId, ServiceId } from "./types.js";

export const ClientSelector = t.type({
  organizationId: tt.option(OrganizationId),
  serviceId: tt.option(ServiceId),
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
