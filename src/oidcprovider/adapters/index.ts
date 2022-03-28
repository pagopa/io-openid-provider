import * as oidc from "oidc-provider";
import { ClientRepository } from "src/core/repositories/ClientRepository";
import { Logger } from "src/logger";
import { makeRedisAdapter, RedisConfig } from "../dal/redis";
import { makeClientAdapter } from "./clientAdapter";
import { makeRegistrationAccessTokenAdapter } from "./registrationAccessTokenAdapter";

export type AdapterProvider = (name: "Client" | string) => oidc.Adapter;

export const adapterProvider =
  (logger: Logger, config: RedisConfig, clientRepository: ClientRepository) =>
  (name: string): oidc.Adapter => {
    const redisAdapter = makeRedisAdapter(config);
    // create the adapter from ClientRepository
    const clientAdapter = makeClientAdapter(logger, clientRepository);
    // create the adapter for RegistrationAccessToken entity
    const registrationAccessTokenAdapter =
      makeRegistrationAccessTokenAdapter(logger);
    logger.debug(`adapterProvider function, parameter 'name': ${name}`);
    switch (name) {
      case "Client":
        return clientAdapter;
      case "RegistrationAccessToken":
        return registrationAccessTokenAdapter;
      default:
        return redisAdapter(name);
    }
  };
