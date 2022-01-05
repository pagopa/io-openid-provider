// disable eslint in this file, this file is going to ve removed
/* eslint-disable */
import * as ioredis from "ioredis";
import * as oidc from "oidc-provider";

// ///////////////////////////////////////////////////////////////////////////////////
//              THIS CODE WAS TAKED FROM WE ARE NOT GOING TO KEEP IT               //
// https://github.com/panva/node-oidc-provider/blob/main/example/adapters/redis.js //
// ///////////////////////////////////////////////////////////////////////////////////

const grantable = new Set([
  "AccessToken",
  "AuthorizationCode",
  "RefreshToken",
  "DeviceCode",
  "BackchannelAuthenticationRequest",
]);

const consumable = new Set([
  "AuthorizationCode",
  "RefreshToken",
  "DeviceCode",
  "BackchannelAuthenticationRequest",
]);

function grantKeyFor(id: string) {
  return `grant:${id}`;
}

function userCodeKeyFor(userCode: string) {
  return `userCode:${userCode}`;
}

function uidKeyFor(uid: string) {
  return `uid:${uid}`;
}

class RedisAdapter {
  readonly name: string;
  readonly client: ioredis.Redis;
  constructor(client: ioredis.Redis, name: string) {
    this.client = client;
    this.name = name;
  }

  async upsert(id: string, payload: oidc.AdapterPayload, expiresIn: number) {
    const key = this.key(id);

    const multi = this.client.multi();
    if (consumable.has(this.name)) {
      const store = JSON.stringify(payload);
      multi.hmset(key, store);
    } else {
      const store = JSON.stringify(payload);
      multi.set(key, store);
    }
    // multi[consumable.has(this.name) ? 'hmset' : 'set'](key, store);

    if (expiresIn) {
      multi.expire(key, expiresIn);
    }

    if (grantable.has(this.name) && payload.grantId) {
      const grantKey = grantKeyFor(payload.grantId);
      multi.rpush(grantKey, key);
      // if you're seeing grant key lists growing out of acceptable proportions consider using LTRIM
      // here to trim the list to an appropriate length
      const ttl = await this.client.ttl(grantKey);
      if (expiresIn > ttl) {
        multi.expire(grantKey, expiresIn);
      }
    }

    if (payload.userCode) {
      const userCodeKey = userCodeKeyFor(payload.userCode);
      multi.set(userCodeKey, id);
      multi.expire(userCodeKey, expiresIn);
    }

    if (payload.uid) {
      const uidKey = uidKeyFor(payload.uid);
      multi.set(uidKey, id);
      multi.expire(uidKey, expiresIn);
    }

    await multi.exec();
  }

  async find(id: string) {
    const data = consumable.has(this.name)
      ? await this.client.hgetall(this.key(id))
      : await this.client.get(this.key(id));

    // if (isEmpty(data)) {
    //   return undefined;
    // }

    if (typeof data === "string") {
      return JSON.parse(data);
    }

    if (data !== null && "payload" in data) {
      const { payload, ...rest } = data;
      return {
        ...rest,
        ...JSON.parse(payload),
      };
    }
  }

  async findByUid(uid: string) {
    const id = await this.client.get(uidKeyFor(uid));
    if (typeof id === "string") {
      return this.find(id);
    }
  }

  async findByUserCode(userCode: string) {
    const id = await this.client.get(userCodeKeyFor(userCode));
    if (typeof id === "string") {
      return this.find(id);
    }
  }

  async destroy(id: string) {
    const key = this.key(id);
    await this.client.del(key);
  }

  async revokeByGrantId(grantId: string) {
    // eslint-disable-line class-methods-use-this
    const multi = this.client.multi();
    const tokens = await this.client.lrange(grantKeyFor(grantId), 0, -1);
    tokens.forEach((token) => multi.del(token));
    multi.del(grantKeyFor(grantId));
    await multi.exec();
  }

  async consume(id: string) {
    await this.client.hset(
      this.key(id),
      "consumed",
      Math.floor(Date.now() / 1000)
    );
  }

  key(id: string) {
    return `${this.name}:${id}`;
  }
}

const makeRedisAdapter =
  (client: ioredis.Redis) =>
  (name: string): oidc.Adapter =>
    new RedisAdapter(client, name);

export { makeRedisAdapter };
