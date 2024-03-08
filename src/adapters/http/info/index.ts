import express from "express";
import { wrapRequestHandler } from "@pagopa/io-functions-commons/dist/src/utils/request_middleware.js";
import * as responses from "@pagopa/ts-commons/lib/responses.js";
import * as TE from "fp-ts/lib/TaskEither.js";
import { pipe } from "fp-ts/lib/function.js";
import { Config } from "../../../config.js";
import { GetInfo } from "../../../generated/definitions/GetInfo.js";

type GetInfoEndpointResponse =
  | responses.IResponseSuccessJson<GetInfo>
  | responses.IResponseErrorInternal;

const getInfoEndpointHandler =
  (config: Config) => (): Promise<GetInfoEndpointResponse> =>
    pipe(
      TE.of({ name: config.info.name, version: config.info.version }),
      TE.map(responses.ResponseSuccessJson),
      TE.toUnion
    )();

const makeRouter = (config: Config): express.Router => {
  const router = express.Router();

  router.get("/info", wrapRequestHandler(getInfoEndpointHandler(config)));

  return router;
};

export { makeRouter, getInfoEndpointHandler };
