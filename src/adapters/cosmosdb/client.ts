/**
 * Use a singleton CosmosDB client across functions.
 */
import { CosmosClient, Database } from "@azure/cosmos";
import * as TE from "fp-ts/TaskEither";
import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/lib/function";
import { Logger } from "../../domain/logger";
import { show } from "../../domain/utils";
import { CosmosDBConfig } from "./types";

/**
 * Create and check the connection to the database
 */
export const makeCosmosDbClient = (
  config: CosmosDBConfig,
  logger: Logger
): TE.TaskEither<string, Database> => {
  const cosmosdbClient = new CosmosClient(config.connectionString);
  const instance = cosmosdbClient.database(config.cosmosDbName);
  return pipe(
    E.tryCatch(() => {
      logger.info("Connecting to the database ...");
      return instance;
    }, E.toError),
    TE.fromEither,
    TE.bimap(
      (error) => {
        logger.error("Error connecting to the database :(.", error);
        return show(error);
      },
      (_) => {
        logger.info("Connected successfully to the database!");
        return instance;
      }
    )
  );
};
