import * as oidc from "oidc-provider";
import { ClientRepository } from "src/core/repositories/ClientRepository";
import { GrantRepository } from "src/core/repositories/GrantRepository";
import { InteractionRequestRepository } from "src/core/repositories/InteractionRequestRepository";
import { SessionRepository } from "src/core/repositories/SessionRepository";
import { Logger } from "src/logger";
import { makeRedisAdapter, RedisConfig } from "../dal/redis";
import { makeClientAdapter } from "./clientAdapter";
import { makeGrantAdapter } from "./grantAdapter";
import { makeInteractionAdapter } from "./interactionAdapter";
import { makeRegistrationAccessTokenAdapter } from "./registrationAccessTokenAdapter";
import { makeSessionAdapter } from "./sessionAdapter";
import { makeNotImplementedAdapter } from "./utils";

export type AdapterProvider = (
  name: "Client" | "Interaction" | "Session" | "Grant" | string
) => oidc.Adapter;

export const adapterProvider =
  (
    logger: Logger,
    config: RedisConfig,
    clientRepository: ClientRepository,
    grantRepository: GrantRepository,
    interactionRequestRepository: InteractionRequestRepository,
    sessionRepository: SessionRepository
    // eslint-disable-next-line max-params
  ) =>
  (name: string): oidc.Adapter => {
    const redisAdapter = makeRedisAdapter(config);
    // create the adapter from ClientRepository
    const clientAdapter = makeClientAdapter(logger, clientRepository);
    // create the adapter from GrantRepository
    const grantAdapter = makeGrantAdapter(logger, grantRepository);
    // create the adapter from InteractionRepository
    const interactionAdapter = makeInteractionAdapter(
      logger,
      interactionRequestRepository
    );
    // create the adapter about the session
    const sessionAdapter = makeSessionAdapter(logger, sessionRepository);
    // create the adapter for RegistrationAccessToken entity
    const registrationAccessTokenAdapter =
      makeRegistrationAccessTokenAdapter(logger);
    logger.debug(`adapterProvider function, parameter 'name': ${name}`);
    switch (name) {
      case "Client":
        return clientAdapter;
      case "RegistrationAccessToken":
        return registrationAccessTokenAdapter;
      case "Grant":
        return grantAdapter;
      case "Interaction":
        return interactionAdapter;
      case "Session":
        return sessionAdapter;
      default:
        return makeNotImplementedAdapter(name, logger);
    }
  };
