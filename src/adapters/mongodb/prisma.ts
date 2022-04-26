import { PrismaClient } from "@prisma/client";
import { pipe } from "fp-ts/lib/function";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { Logger } from "../../domain/logger";
import { show } from "../../domain/utils";
import { MongoDBConfig } from "./types";

/**
 * Create and check the connection to the database
 */
export const makePrismaClient = (
  config: MongoDBConfig,
  logger: Logger
): TE.TaskEither<string, PrismaClient> => {
  const client = new PrismaClient({
    datasources: { db: { url: config.connectionString.href } },
  });
  return pipe(
    TE.tryCatch(() => {
      logger.info("Connecting to the database ...");
      return client.$connect();
    }, E.toError),
    TE.bimap(
      (error) => {
        logger.error("Error connecting to the database :(.", error);
        return show(error);
      },
      (_) => {
        logger.info("Connected successfully to the database!");
        return client;
      }
    )
  );
};
