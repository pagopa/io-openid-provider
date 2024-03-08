import { pipe } from "fp-ts/lib/function.js";
import * as TE from "fp-ts/lib/TaskEither.js";
import { responses } from "@pagopa/ts-commons";
import { FiscalCode } from "../../../generated/definitions/FiscalCode.js";
import { Logger } from "../../../domain/logger/index.js";
import { OrganizationFiscalCode } from "../../../generated/definitions/OrganizationFiscalCode.js";
import { ServiceId } from "../../../generated/definitions/ServiceId.js";
import { IResponseNoContent, ResponseNoContent } from "../utils.js";
import { OrganizationId } from "../../../domain/clients/types.js";
import { IdentityId } from "../../../domain/identities/types.js";
import { RemoveGrantUseCase } from "../../../useCases/RemoveGrantUseCase.js";
import { DomainErrorTypes } from "../../../domain/types/index.js";
import { show } from "../../../domain/utils.js";

type DeleteGrantEndpointHandler =
  | IResponseNoContent
  | responses.IResponseErrorValidation
  | responses.IResponseErrorNotFound
  | responses.IResponseErrorInternal;

export const deleteGrantEndpointHandler =
  (logger: Logger, removeGrantUseCase: RemoveGrantUseCase) =>
  (
    organizationId: OrganizationFiscalCode,
    serviceId: ServiceId,
    identityId: FiscalCode
  ): Promise<DeleteGrantEndpointHandler> =>
    pipe(
      removeGrantUseCase(
        organizationId as OrganizationId,
        serviceId,
        identityId as IdentityId
      ),
      TE.bimap(
        (error) => {
          switch (error.kind) {
            case DomainErrorTypes.NOT_FOUND:
              return responses.ResponseErrorNotFound(
                "Not Found",
                "Grant not found"
              );
            case DomainErrorTypes.GENERIC_ERROR:
            case DomainErrorTypes.NOT_IMPLEMENTED:
              return responses.ResponseErrorInternal(
                "Internal Error deleting grants"
              );
            default:
              logger.error(
                `Unexpected error type deleting grants; ${show(error)}`,
                error
              );
              return responses.ResponseErrorInternal(
                "Internal Error deleting grants"
              );
          }
        },
        () => ResponseNoContent("No Content")
      ),
      TE.toUnion
    )();
