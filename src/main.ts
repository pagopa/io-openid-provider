/** This is the main application entry point, the initialization of the adapters are done here */
import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/lib/function";
import { makeApplication, startApplication } from "./adapters/http";
import * as ioBackend from "./adapters/ioBackend";
import * as mongodb from "./adapters/mongodb";
import { makeLogger } from "./adapters/winston";
import { parseConfig } from "./config";

/** Log the given string and exit with status 1 */
const exit = (error: string): void => {
  const logger = makeLogger({ logLevel: "error", logName: "main" });
  logger.error(`Shutting down application ${error}`);
  process.exit(1);
};

/** The entry-point */
pipe(
  parseConfig(process.env),
  E.map((config) => {
    const logger = makeLogger(config.logger);

    const { ioAuthClient } = ioBackend.makeIOClients(
      config.IOBackend.baseURL,
      ioBackend.timeoutFetch
    );
    const identityService = ioBackend.makeIdentityService(logger, ioAuthClient);

    const clientService = mongodb.makeClientService(config.mongodb, logger);
    const interactionService = mongodb.makeInteractionService(
      config.mongodb,
      logger
    );
    const sessionService = mongodb.makeSessionService(config.mongodb, logger);
    const grantService = mongodb.makeGrantService(config.mongodb, logger);

    const application = makeApplication({
      clientService,
      config,
      grantService,
      identityService,
      interactionService,
      logger,
      sessionService,
    });
    startApplication(application, logger);
  }),
  E.mapLeft(exit)
);
