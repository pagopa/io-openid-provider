import express from "express";
import {
  withRequestMiddlewares,
  wrapRequestHandler,
} from "@pagopa/ts-commons/lib/request_middleware";
import { RequiredParamMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/required_param";
import { FiscalCode } from "../../../generated/definitions/FiscalCode";
import { Logger } from "../../../domain/logger";
import { OrganizationFiscalCode } from "../../../generated/definitions/OrganizationFiscalCode";
import { ServiceId } from "../../../generated/definitions/ServiceId";
import { RequiredHeaderMiddleware } from "../utils";
import { FindGrantUseCase } from "../../../useCases/FindGrantUseCases";
import { RemoveGrantUseCase } from "../../../useCases/RemoveGrantUseCase";
import { deleteGrantEndpointHandler } from "./deleteGrantEndpoint";
import { findGrantEndpoint } from "./findGrantEndpoint";

export const makeRouter = (
  logger: Logger,
  findGrantUseCase: FindGrantUseCase,
  removeGrantUseCase: RemoveGrantUseCase
): express.Router => {
  const router = express.Router();

  router.get(
    "/admin/grants/:organizationId/:serviceId",
    wrapRequestHandler(
      withRequestMiddlewares(
        RequiredParamMiddleware("organizationId", OrganizationFiscalCode),
        RequiredParamMiddleware("serviceId", ServiceId),
        RequiredHeaderMiddleware("identityId", FiscalCode)
      )(findGrantEndpoint(findGrantUseCase))
    )
  );

  router.delete(
    "/admin/grants/:organizationId/:serviceId",
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
