import * as oidc from "oidc-provider";
import { Logger } from "../../../../domain/logger/index.js";
import { ClientService } from "../../../../domain/clients/ClientService.js";
import { InteractionService } from "../../../../domain/interactions/InteractionService.js";
import { SessionService } from "../../../../domain/sessions/SessionService.js";
import { GrantService } from "../../../../domain/grants/GrantService.js";
import { makeClientAdapter } from "./adapters/clientAdapter.js";
import { makeInteractionAdapter } from "./adapters/interactionAdapter.js";
import { makeRegistrationAccessTokenAdapter } from "./adapters/registrationAccessTokenAdapter.js";
import { makeSessionAdapter } from "./adapters/sessionAdapter.js";
import { makeGrantAdapter } from "./adapters/grantAdapter.js";

export type AdapterProvider = (
  name: "Client" | "Interaction" | "RegistrationAccessToken" | string
) => oidc.Adapter;

export const makeAdapterProvider =
  (
    logger: Logger,
    clientService: ClientService,
    interactionService: InteractionService,
    sessionService: SessionService,
    grantService: GrantService
  ): AdapterProvider =>
  (name: string) => {
    logger.debug(`Instantiate ${name} Adapter`);
    // create the adapter from ClientService
    const clientAdapter = makeClientAdapter(logger, clientService);
    // create the adapter from Consent and Login request
    const interactionAdapter = makeInteractionAdapter(
      logger,
      interactionService
    );
    // create the adapter from Session
    const sessionAdapter = makeSessionAdapter(logger, sessionService);
    // create the adapter from Grant
    const grantAdapter = makeGrantAdapter(logger, grantService);
    // create the adapter for RegistrationAccessToken entity
    const registrationAccessTokenAdapter =
      makeRegistrationAccessTokenAdapter(logger);

    switch (name) {
      case "Client":
        return clientAdapter;
      case "Interaction":
        return interactionAdapter;
      case "RegistrationAccessToken":
        return registrationAccessTokenAdapter;
      case "Session":
        return sessionAdapter;
      case "Grant":
        return grantAdapter;
      default:
        logger.error(`makeAdapterProvider - Unexpected type ${name}`);
        throw new Error("NYI");
    }
  };
