/** This is the main application entry point, the initialization of the adapters are done here */
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/function";
import { makeApplication, startApplication } from "./adapters/http";
import * as ioBackend from "./adapters/ioBackend";
import * as mongodb from "./adapters/mongodb";
import { makeLogger, makeAppInsightsLogger } from "./adapters/winston";
import { parseConfig } from "./config";
import { makeUseCases } from "./useCases";

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
  TE.bind("prisma", (env) =>
    mongodb.makePrismaClient(env.config.mongodb, env.logger)
  ),
  // create the application
  TE.map(({ config, logger, prisma }) => {
    const { ioAuthClient } = ioBackend.makeIOClients(
      config.IOClient,
      ioBackend.timeoutFetch
    );
    const identityService = ioBackend.makeIdentityService(logger, ioAuthClient);

    const clientService = mongodb.makeClientService(logger, prisma.client);
    const interactionService = mongodb.makeInteractionService(
      logger,
      prisma.interaction
    );
    const sessionService = mongodb.makeSessionService(logger, prisma.session);
    const grantService = mongodb.makeGrantService(logger, prisma.grant);

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
