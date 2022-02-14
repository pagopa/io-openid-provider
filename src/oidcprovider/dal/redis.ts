import * as oidc from "oidc-provider";
import * as ioredis from "ioredis";
import * as badradis from "./badredis";

interface RedisConfig {
  readonly url: string;
  readonly keyPrefix: string;
}

type RedisDao = (name: string) => oidc.Adapter;

const makeRedisAdapter = (config: RedisConfig): RedisDao => {
  const client = new ioredis.default(config.url, {
    keyPrefix: config.keyPrefix,
  });
  return badradis.makeRedisAdapter(client);
};

export { RedisDao, RedisConfig, makeRedisAdapter };
