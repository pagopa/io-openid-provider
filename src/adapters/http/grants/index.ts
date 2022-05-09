import {
  withRequestMiddlewares,
  wrapRequestHandler,
} from "@pagopa/ts-commons/lib/request_middleware";
import express from "express";
import { RequiredParamMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/required_param";
import { responses } from "@pagopa/ts-commons";
import { FiscalCode } from "../../../generated/definitions/FiscalCode";
import { GrantService } from "../../../domain/grants/GrantService";
import { Logger } from "../../../domain/logger";
import { OrganizationFiscalCode } from "../../../generated/definitions/OrganizationFiscalCode";
import { ServiceId } from "../../../generated/definitions/ServiceId";
import { RequiredHeaderMiddleware } from "../utils";
// import { pipe } from "fp-ts/lib/function";

type DeleteGrantEndpointHandler =
  | responses.IResponseSuccessAccepted // TODO: Use NoContent instead Accepted
  | responses.IResponseErrorValidation
  | responses.IResponseErrorNotFound
  | responses.IResponseErrorInternal;

const deleteGrantEndpointHandler =
  (_logger: Logger, _grantService: GrantService) =>
  (
    _organizationId: OrganizationFiscalCode,
    _serviceId: ServiceId,
    _identityId: FiscalCode
  ): Promise<DeleteGrantEndpointHandler> =>
    // TODO: Add implementation
    Promise.reject();

export const makeRouter = (
  logger: Logger,
  grantService: GrantService
): express.Router => {
  const router = express.Router();

  router.delete(
    "/admin/grants/:organizationId/:serviceId",
    wrapRequestHandler(
      withRequestMiddlewares(
        RequiredParamMiddleware("organizationId", OrganizationFiscalCode),
        RequiredParamMiddleware("serviceId", ServiceId),
        RequiredHeaderMiddleware("identityId", FiscalCode)
      )(deleteGrantEndpointHandler(logger, grantService))
    )
  );

  return router;
};
