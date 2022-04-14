/** This is the main application entry point, the initialization of the adapters are done here */
import { pipe } from "fp-ts/lib/function";
import * as E from "fp-ts/Either";
import * as inMemory from "./adapters/inMemory";
import * as ioBackend from "./adapters/ioBackend";
import { parseConfig } from "./config";
import { makeLogger } from "./adapters/winston";
import { makeApplication, startApplication } from "./adapters/http";

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

    const clientService = inMemory.makeClientService();
    const interactionService = inMemory.makeInteractionService();
    const sessionService = inMemory.makeSessionService();
    const grantService = inMemory.makeGrantService();

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
