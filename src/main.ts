/** This is the main application entry point, the initialization of the adapters are done here */
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/function";
import { makeApplication, startApplication } from "./adapters/http";
import * as ioBackend from "./adapters/ioBackend";
import * as adapter from "./adapters/cosmosdb";
import { makeLogger, makeAppInsightsLogger } from "./adapters/winston";
import { parseConfig } from "./config";
import { makeUseCases } from "./useCases";
import {
  CLIENT_COLLECTION_NAME,
  ClientModel,
} from "./adapters/cosmosdb/model/client";
import { makeCosmosDbClient } from "./adapters/cosmosdb/cosmosdb";
import {
  GRANT_COLLECTION_NAME,
  GrantModel,
} from "./adapters/cosmosdb/model/grant";
import {
  INTERACTION_COLLECTION_NAME,
  InteractionModel,
} from "./adapters/cosmosdb/model/interaction";
import {
  SESSION_COLLECTION_NAME,
  SessionModel,
} from "./adapters/cosmosdb/model/session";

/** Log the given string and exit with status 1 */
const exit = (error: string): void => {
  const logger = makeLogger({ logLevel: "error", logName: "main" });
  logger.error(`Shutting down application ${error}`);
  process.exit(1);
};

/** The entry-point */
void pipe(
  TE.Do,
  // parse configuraiton
  TE.apS("config", TE.fromEither(parseConfig(process.env))),
  // create the main logger
  TE.bind("logger", (env) =>
    TE.of(
      process.env.APPINSIGHTS_INSTRUMENTATIONKEY
        ? makeAppInsightsLogger(
            process.env.APPINSIGHTS_INSTRUMENTATIONKEY,
            env.config.logger
          )
        : makeLogger(env.config.logger)
    )
  ),
  // create connection with db
  TE.bind("cosmosdb", (env) =>
    makeCosmosDbClient(env.config.cosmosdb, env.logger)
  ),
  // create the application
  TE.map(({ config, logger, cosmosdb }) => {
    const { ioAuthClient } = ioBackend.makeIOClients(
      config.IOClient,
      ioBackend.timeoutFetch
    );
    const identityService = ioBackend.makeIdentityService(logger, ioAuthClient);

    const clientModel = new ClientModel(
      cosmosdb.container(CLIENT_COLLECTION_NAME)
    );
    const clientService = adapter.makeClientService(logger, clientModel);

    const interactionModel = new InteractionModel(
      cosmosdb.container(INTERACTION_COLLECTION_NAME)
    );
    const interactionService = adapter.makeInteractionService(
      logger,
      interactionModel
    );

    const sessionModel = new SessionModel(
      cosmosdb.container(SESSION_COLLECTION_NAME)
    );
    const sessionService = adapter.makeSessionService(logger, sessionModel);

    const grantModel = new GrantModel(
      cosmosdb.container(GRANT_COLLECTION_NAME)
    );
    const grantService = adapter.makeGrantService(logger, grantModel);

    // initialize UseCases
    const useCases = makeUseCases(
      logger,
      config.features,
      identityService,
      interactionService,
      clientService,
      grantService
    );

    const application = makeApplication({
      clientService,
      config,
      grantService,
      interactionService,
      logger,
      sessionService,
      useCases,
    });
    startApplication(application, logger);
  }),
  TE.mapLeft(exit)
)();
