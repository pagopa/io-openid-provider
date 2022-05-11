/** This is the main application entry point, the initialization of the adapters are done here */
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/function";
import { makeApplication, startApplication } from "./adapters/http";
import * as ioBackend from "./adapters/ioBackend";
import * as mongodb from "./adapters/mongodb";
import { makeLogger } from "./adapters/winston";
import { Config, parseConfig } from "./config";
import { AbortInteractionUseCase } from "./domain/useCases/AbortInteractionUseCase";
import { AuthenticateUseCase } from "./domain/useCases/AuthenticateUseCase";
import { ClientListUseCase } from "./domain/useCases/ClientListUseCase";
import { ConfirmConsentUseCase } from "./domain/useCases/ConfirmConsentUseCase";
import { FindGrantUseCase } from "./domain/useCases/FindGrantUseCases";
import { ProcessInteractionUseCase } from "./domain/useCases/ProcessInteractionUseCase";
import { RemoveGrantUseCase } from "./domain/useCases/RemoveGrantUseCase";
import { Logger } from "./domain/logger";
import { IdentityService } from "./domain/identities/IdentityService";
import { InteractionService } from "./domain/interactions/InteractionService";
import { ClientService } from "./domain/clients/ClientService";
import { GrantService } from "./domain/grants/GrantService";

/** Log the given string and exit with status 1 */
const exit = (error: string): void => {
  const logger = makeLogger({ logLevel: "error", logName: "main" });
  logger.error(`Shutting down application ${error}`);
  process.exit(1);
};

export const makeUseCases = (
  logger: Logger,
  config: Config,
  identityService: IdentityService,
  interactionService: InteractionService,
  clientService: ClientService,
  grantService: GrantService
  // eslint-disable-next-line max-params
) => {
  const abortInteractionUseCase = AbortInteractionUseCase(
    logger,
    interactionService
  );
  const authenticateUseCase = AuthenticateUseCase(logger, identityService);
  const clientListUseCase = ClientListUseCase(logger, clientService);
  const confirmConsentUseCase = ConfirmConsentUseCase(
    config.grantTTL,
    logger,
    interactionService,
    grantService
  );
  const findGrantUseCase = FindGrantUseCase(logger, grantService);
  const processInteractionUseCase = ProcessInteractionUseCase(
    logger,
    identityService,
    interactionService,
    clientService,
    grantService
  );
  const removeGrantUseCase = RemoveGrantUseCase(logger, grantService);
  return {
    abortInteractionUseCase,
    authenticateUseCase,
    clientListUseCase,
    confirmConsentUseCase,
    findGrantUseCase,
    processInteractionUseCase,
    removeGrantUseCase,
  };
};

/** The entry-point */
void pipe(
  TE.Do,
  // parse configuraiton
  TE.apS("config", TE.fromEither(parseConfig(process.env))),
  // create the main logger
  TE.bind("logger", (env) => TE.of(makeLogger(env.config.logger))),
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
      config,
      identityService,
      interactionService,
      clientService,
      grantService
    );

    const application = makeApplication({
      ...useCases,
      clientService,
      config,
      grantService,
      interactionService,
      logger,
      sessionService,
    });
    startApplication(application, logger);
  }),
  TE.mapLeft(exit)
)();
