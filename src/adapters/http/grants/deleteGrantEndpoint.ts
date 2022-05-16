import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/TaskEither";
import { responses } from "@pagopa/ts-commons";
import { FiscalCode } from "../../../generated/definitions/FiscalCode";
import { Logger } from "../../../domain/logger";
import { OrganizationFiscalCode } from "../../../generated/definitions/OrganizationFiscalCode";
import { ServiceId } from "../../../generated/definitions/ServiceId";
import { IResponseNoContent, ResponseNoContent } from "../utils";
import {
  OrganizationId,
  ServiceId as DomainServiceId,
} from "../../../domain/clients/types";
import { IdentityId } from "../../../domain/identities/types";
import { RemoveGrantUseCase } from "../../../useCases/RemoveGrantUseCase";
import { DomainErrorTypes } from "../../../domain/types";
import { show } from "../../../domain/utils";

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
        serviceId as DomainServiceId,
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
