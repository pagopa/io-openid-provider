import * as TE from "fp-ts/TaskEither";
import { Client, DomainErrorTypes } from "../core/domain";
import { ClientRepository } from "../core/repositories/ClientRepository";
import { PostgresConfig } from "./domain";

/**
 * Create a ClientRepository instance that uses PostgreSQL as backing store
 */
export const makeClientRepository = (
  _config: PostgresConfig
): ClientRepository => ({
  remove: (_id: string) =>
    TE.left({ causedBy: undefined, kind: DomainErrorTypes.NOT_IMPLEMENTED }),
  upsert: (_client: Client) =>
    TE.left({ causedBy: undefined, kind: DomainErrorTypes.NOT_IMPLEMENTED }),
});
