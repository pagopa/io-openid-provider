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
import { ListGrantUseCase } from "../../../useCases/ListGrantUseCase";
import { deleteGrantEndpointHandler } from "./deleteGrantEndpoint";
import { findGrantEndpoint } from "./findGrantEndpoint";
import { listGrantEndpoint } from "./listGrantEndpoint";

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
