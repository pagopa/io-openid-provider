import * as oidc from "oidc-provider";
import { Logger } from "../../../../domain/logger";
import { ClientService } from "../../../../domain/clients/ClientService";
import { InteractionService } from "../../../../domain/interactions/InteractionService";
import { SessionService } from "../../../../domain/sessions/SessionService";
import { GrantService } from "../../../../domain/grants/GrantService";
import { makeClientAdapter } from "./adapters/clientAdapter";
import { makeInteractionAdapter } from "./adapters/interactionAdapter";
import { makeRegistrationAccessTokenAdapter } from "./adapters/registrationAccessTokenAdapter";
import { makeSessionAdapter } from "./adapters/sessionAdapter";
import { makeGrantAdapter } from "./adapters/grantAdapter";

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

    // eslint-disable-next-line sonarjs/no-small-switch
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
