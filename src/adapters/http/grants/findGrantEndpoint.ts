import { pipe } from "fp-ts/lib/function.js";
import * as TE from "fp-ts/lib/TaskEither.js";
import { responses } from "@pagopa/ts-commons";
import { FiscalCode } from "../../../generated/definitions/FiscalCode.js";
import { OrganizationFiscalCode } from "../../../generated/definitions/OrganizationFiscalCode.js";
import { ServiceId } from "../../../generated/definitions/ServiceId.js";
import { APIGrantDetail } from "../../../generated/definitions/APIGrantDetail.js";
import { FindGrantUseCase } from "../../../useCases/FindGrantUseCases.js";
import { OrganizationId } from "../../../domain/clients/types.js";
import { IdentityId } from "../../../domain/identities/types.js";
import { Grant } from "../../../domain/grants/types.js";
import { DomainErrorTypes } from "../../../domain/types/index.js";

export const makeAPIGrant = (grant: Grant): APIGrantDetail => ({
  expireAt: grant.expireAt,
  id: grant.id,
  identityId: grant.subjects.identityId,
  issuedAt: grant.issuedAt,
  organizationId: grant.subjects.clientId.organizationId,
  scope: grant.scope.split(" "),
  serviceId: grant.subjects.clientId.serviceId,
});
type FindGrantEndpoint =
  | responses.IResponseSuccessJson<APIGrantDetail>
  | responses.IResponseErrorValidation
  | responses.IResponseErrorNotFound
  | responses.IResponseErrorInternal;

export const findGrantEndpoint =
  (findGrantUseCase: FindGrantUseCase) =>
  (
    organizationId: OrganizationFiscalCode,
    serviceId: ServiceId,
    identityId: FiscalCode
  ): Promise<FindGrantEndpoint> =>
    pipe(
      findGrantUseCase(
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
                "Grant Not Found"
              );
            case DomainErrorTypes.GENERIC_ERROR:
            case DomainErrorTypes.NOT_IMPLEMENTED:
            default:
              return responses.ResponseErrorInternal("Internal Error");
          }
        },
        (grant) => responses.ResponseSuccessJson(makeAPIGrant(grant))
      ),
      TE.toUnion
    )();
