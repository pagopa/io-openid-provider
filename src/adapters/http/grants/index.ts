import {
  withRequestMiddlewares,
  wrapRequestHandler,
} from "@pagopa/ts-commons/lib/request_middleware";
import express from "express";
import { RequiredParamMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/required_param";
import { responses } from "@pagopa/ts-commons";
import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/TaskEither";
import {
  ResponseErrorInternal,
  ResponseErrorNotFound,
  ResponseSuccessAccepted,
} from "@pagopa/ts-commons/lib/responses";
import { DomainErrorTypes } from "../../../domain/types";
import { FiscalCode } from "../../../generated/definitions/FiscalCode";
import { GrantService } from "../../../domain/grants/GrantService";
import { Logger } from "../../../domain/logger";
import { OrganizationFiscalCode } from "../../../generated/definitions/OrganizationFiscalCode";
import { ServiceId } from "../../../generated/definitions/ServiceId";
import { RequiredHeaderMiddleware } from "../utils";
import { ClientService } from "../../../domain/clients/ClientService";
import { RemoveGrantUseCase } from "../../../domain/useCases/RemoveGrantUseCase";
import { show } from "../../../domain/utils";
import {
  OrganizationId,
  ServiceId as DomainServiceId,
} from "../../../domain/clients/types";
import { IdentityId } from "../../../domain/identities/types";

type DeleteGrantEndpointHandler =
  | responses.IResponseSuccessAccepted // TODO: Use NoContent instead Accepted
  | responses.IResponseErrorValidation
  | responses.IResponseErrorNotFound
  | responses.IResponseErrorInternal;

const deleteGrantEndpointHandler =
  (logger: Logger, grantService: GrantService, clientService: ClientService) =>
  (
    organizationId: OrganizationFiscalCode,
    serviceId: ServiceId,
    identityId: FiscalCode
  ): Promise<DeleteGrantEndpointHandler> =>
    pipe(
      RemoveGrantUseCase(logger, grantService, clientService)(
        organizationId as OrganizationId,
        serviceId as DomainServiceId,
        identityId as IdentityId
      ),
      TE.bimap(
        (error) => {
          switch (error) {
            case DomainErrorTypes.NOT_FOUND:
              return ResponseErrorNotFound("Not Found", "Grant not found");
            case DomainErrorTypes.GENERIC_ERROR:
            case DomainErrorTypes.NOT_IMPLEMENTED:
              return ResponseErrorInternal("Internal Error deleting grants");
            default:
              logger.error(
                `Unexpected error type deleting grants; ${show(error)}`,
                error
              );
              return ResponseErrorInternal("Internal Error deleting grants");
          }
        },
        () => ResponseSuccessAccepted("No Content", undefined)
      ),
      TE.toUnion
    )();

export const makeRouter = (
  logger: Logger,
  grantService: GrantService,
  clientService: ClientService
): express.Router => {
  const router = express.Router();

  router.delete(
    "/admin/grants/:organizationId/:serviceId",
    wrapRequestHandler(
      withRequestMiddlewares(
        RequiredParamMiddleware("organizationId", OrganizationFiscalCode),
        RequiredParamMiddleware("serviceId", ServiceId),
        RequiredHeaderMiddleware("identityId", FiscalCode)
      )(deleteGrantEndpointHandler(logger, grantService, clientService))
    )
  );

  return router;
};
