import express from "express";
import {
  withRequestMiddlewares,
  wrapRequestHandler,
} from "@pagopa/ts-commons/lib/request_middleware.js";
import { RequiredParamMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/required_param.js";
import { FiscalCode } from "../../../generated/definitions/FiscalCode.js";
import { Logger } from "../../../domain/logger/index.js";
import { OrganizationFiscalCode } from "../../../generated/definitions/OrganizationFiscalCode.js";
import { ServiceId } from "../../../generated/definitions/ServiceId.js";
import { RequiredHeaderMiddleware } from "../utils.js";
import { FindGrantUseCase } from "../../../useCases/FindGrantUseCases.js";
import { RemoveGrantUseCase } from "../../../useCases/RemoveGrantUseCase.js";
import { ListGrantUseCase } from "../../../useCases/ListGrantUseCase.js";
import { deleteGrantEndpointHandler } from "./deleteGrantEndpoint.js";
import { findGrantEndpoint } from "./findGrantEndpoint.js";
import { listGrantEndpoint } from "./listGrantEndpoint.js";

export const makeRouter = (
  logger: Logger,
  findGrantUseCase: FindGrantUseCase,
  removeGrantUseCase: RemoveGrantUseCase,
  listGrantUseCase: ListGrantUseCase
): express.Router => {
  const router = express.Router();

  router.get(
    "/grants",
    wrapRequestHandler(
      withRequestMiddlewares(
        RequiredHeaderMiddleware("identityId", FiscalCode)
      )(listGrantEndpoint(listGrantUseCase))
    )
  );

  router.get(
    "/grants/:organizationId/:serviceId",
    wrapRequestHandler(
      withRequestMiddlewares(
        RequiredParamMiddleware("organizationId", OrganizationFiscalCode),
        RequiredParamMiddleware("serviceId", ServiceId),
        RequiredHeaderMiddleware("identityId", FiscalCode)
      )(findGrantEndpoint(findGrantUseCase))
    )
  );

  router.delete(
    "/grants/:organizationId/:serviceId",
    wrapRequestHandler(
      withRequestMiddlewares(
        RequiredParamMiddleware("organizationId", OrganizationFiscalCode),
        RequiredParamMiddleware("serviceId", ServiceId),
        RequiredHeaderMiddleware("identityId", FiscalCode)
      )(deleteGrantEndpointHandler(logger, removeGrantUseCase))
    )
  );

  return router;
};
