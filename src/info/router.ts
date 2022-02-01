import express from "express";
import { wrapRequestHandler } from "@pagopa/io-functions-commons/dist/src/utils/request_middleware";
import * as responses from "@pagopa/ts-commons/lib/responses";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/function";
import { Config } from "../config";
import { GetInfo } from "../generated/definitions/GetInfo";

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

  router.get("/api/info", wrapRequestHandler(getInfoEndpointHandler(config)));

  return router;
};

export { makeRouter, getInfoEndpointHandler };
