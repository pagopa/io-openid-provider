import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/TaskEither";
import { responses } from "@pagopa/ts-commons";
import { FiscalCode } from "../../../generated/definitions/FiscalCode";
import { OrganizationFiscalCode } from "../../../generated/definitions/OrganizationFiscalCode";
import { ServiceId } from "../../../generated/definitions/ServiceId";
import { APIGrantDetail } from "../../../generated/definitions/APIGrantDetail";
import { FindGrantUseCase } from "../../../useCases/FindGrantUseCases";
import {
  OrganizationId,
  ServiceId as DomainServiceId,
} from "../../../domain/clients/types";
import { IdentityId } from "../../../domain/identities/types";
import { Grant } from "../../../domain/grants/types";
import { DomainErrorTypes } from "../../../domain/types";

const makeAPIGrant = (grant: Grant): APIGrantDetail => ({
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
        serviceId as DomainServiceId,
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
