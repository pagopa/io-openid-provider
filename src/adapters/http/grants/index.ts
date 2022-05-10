import express from "express";
import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/TaskEither";
import {
  withRequestMiddlewares,
  wrapRequestHandler,
} from "@pagopa/ts-commons/lib/request_middleware";
import { RequiredParamMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/required_param";
import { responses } from "@pagopa/ts-commons";
import { FiscalCode } from "../../../generated/definitions/FiscalCode";
import { GrantService } from "../../../domain/grants/GrantService";
import { Logger } from "../../../domain/logger";
import { OrganizationFiscalCode } from "../../../generated/definitions/OrganizationFiscalCode";
import { ServiceId } from "../../../generated/definitions/ServiceId";
import { RequiredHeaderMiddleware } from "../utils";
import { APIGrantDetail } from "../../../generated/definitions/APIGrantDetail";
import { FindGrantUseCase } from "../../../domain/useCases/FindGrantUseCases";
import {
  OrganizationId,
  ServiceId as DServiceId,
} from "../../../domain/clients/types";
import { IdentityId } from "../../../domain/identities/types";
import { Grant } from "../../../domain/grants/types";

const makeAPIGrant = (grant: Grant): APIGrantDetail => ({
  expireAt: grant.expireAt,
  id: grant.id,
  identityId: grant.subjects.identityId,
  issuedAt: grant.issuedAt,
  organizationId: grant.subjects.clientId.organizationId,
  scope: grant.scope?.split(" ") || [],
  serviceId: grant.subjects.clientId.serviceId,
});
type FindGrantEndpoint =
  | responses.IResponseSuccessJson<APIGrantDetail>
  | responses.IResponseErrorValidation
  | responses.IResponseErrorNotFound
  | responses.IResponseErrorInternal;
const findGrantEndpoint =
  (logger: Logger, grantService: GrantService) =>
  (
    organizationId: OrganizationFiscalCode,
    serviceId: ServiceId,
    identityId: FiscalCode
  ): Promise<FindGrantEndpoint> =>
    pipe(
      FindGrantUseCase(logger, grantService)(
        organizationId as OrganizationId,
        serviceId as DServiceId,
        identityId as IdentityId
      ),
      TE.bimap(
        (error) => {
          switch (error) {
            case "NotFound":
              return responses.ResponseErrorNotFound(
                "Not Found",
                "Grant Not Found"
              );
            case "InternalError":
            default:
              return responses.ResponseErrorInternal("Internal Error");
          }
        },
        (grant) => responses.ResponseSuccessJson(makeAPIGrant(grant))
      ),
      TE.toUnion
    )();

export const makeRouter = (
  logger: Logger,
  grantService: GrantService
): express.Router => {
  const router = express.Router();

  router.get(
    "/admin/grants/:organizationId/:serviceId",
    wrapRequestHandler(
      withRequestMiddlewares(
        RequiredParamMiddleware("organizationId", OrganizationFiscalCode),
        RequiredParamMiddleware("serviceId", ServiceId),
        RequiredHeaderMiddleware("identityId", FiscalCode)
      )(findGrantEndpoint(logger, grantService))
    )
  );

  return router;
};
