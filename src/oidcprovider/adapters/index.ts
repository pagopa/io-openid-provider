import * as oidc from "oidc-provider";
import { ClientRepository } from "src/core/repositories/ClientRepository";
import { Logger } from "src/logger";
import { makeRedisAdapter, RedisConfig } from "../dal/redis";
import { makeClientAdapter } from "./clientAdapter";

export type AdapterProvider = (name: "Client" | string) => oidc.Adapter;

export const adapterProvider =
  (logger: Logger, config: RedisConfig, clientRepository: ClientRepository) =>
  (name: string): oidc.Adapter => {
    const redisAdapter = makeRedisAdapter(config);
    const clientAdapter = makeClientAdapter(logger, clientRepository);
    logger.debug("adapterProvider function, parameter 'name': ", name);
    // eslint-disable-next-line sonarjs/no-small-switch
    switch (name) {
      case "Client":
        return clientAdapter;
      default:
        return redisAdapter(name);
    }
  };
