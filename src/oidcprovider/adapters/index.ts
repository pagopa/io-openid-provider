import * as oidc from "oidc-provider";
import { ClientRepository } from "src/core/repositories/ClientRepository";
import { GrantRepository } from "src/core/repositories/GrantRepository";
import { Logger } from "src/logger";
import { makeRedisAdapter, RedisConfig } from "../dal/redis";
import { makeClientAdapter } from "./clientAdapter";
import { makeGrantAdapter } from "./grantAdapter";
import { makeRegistrationAccessTokenAdapter } from "./registrationAccessTokenAdapter";

export type AdapterProvider = (
  name: "Client" | "Interaction" | "Session" | "Grant" | string
) => oidc.Adapter;

export const adapterProvider =
  (
    logger: Logger,
    config: RedisConfig,
    clientRepository: ClientRepository,
    grantRepository: GrantRepository
  ) =>
  (name: string): oidc.Adapter => {
    const redisAdapter = makeRedisAdapter(config);
    // create the adapter from ClientRepository
    const clientAdapter = makeClientAdapter(logger, clientRepository);
    // create the adapter from GrantRepository
    const grantAdapter = makeGrantAdapter(logger, grantRepository);
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
      default:
        return redisAdapter(name);
    }
  };
