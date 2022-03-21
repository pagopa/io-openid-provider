import * as oidc from "oidc-provider";
import { makeRedisAdapter, RedisConfig } from "../dal/redis";

export type AdapterProvider = (name: "Client" | string) => oidc.Adapter;

export const adapterProvider =
  (config: RedisConfig) =>
  (name: string): oidc.Adapter => {
    const redisAdapter = makeRedisAdapter(config);
    const clientAdapter = redisAdapter("Client");
    // eslint-disable-next-line sonarjs/no-small-switch
    switch (name) {
      case "Client":
        return clientAdapter;
      default:
        return redisAdapter(name);
    }
  };
