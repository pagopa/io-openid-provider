/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable extra-rules/no-commented-out-code */
/* eslint-disable prettier/prettier */
// eslint-disable sonarjs/prefer-immediate-return
import express from "express";
import {
  Configuration,
  Provider,
  Account,
  KoaContextWithOIDC,
} from "oidc-provider";
import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/TaskEither";
import { Config } from "src/config";

const fakeFindAccount = (
  _ctx: KoaContextWithOIDC,
  id: string
): Promise<Account> =>
  pipe(
    TE.of({
      accountId: id,
      claims: (_use: string, _scope: string) => ({ sub: id }),
    }),
    TE.toUnion
  )();

const makeRouter = (_config: Config): express.Router => {
  const configuration: Configuration = {
    clients: [
      {
        client_id: "foo",
        client_secret: "bar",
        grant_types: ["none"],
        redirect_uris: ["http://client.example.org/cb"],
      },
    ],
    features: {
      rpInitiatedLogout: {
        enabled: false,
      },
      userinfo: {
        enabled: false,
      },
    },
    findAccount: fakeFindAccount,
    responseTypes: ["id_token"],
    routes: {
      authorization: "/oauth/authorize",
    },
    scopes: ["openid"],
    tokenEndpointAuthMethods: ["none"],
  };
  const provider = new Provider("http://localhost:3000", configuration);

  const router = express.Router();

  router.use("/", provider.callback());

  return router;
};

export { makeRouter };
