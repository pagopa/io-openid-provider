import { pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/Option";
import * as RA from "fp-ts/ReadonlyArray";
import * as TE from "fp-ts/TaskEither";
import { Logger } from "../domain/logger";
import { GrantService } from "../domain/grants/GrantService";
import { Grant } from "../domain/grants/types";
import { IdentityId } from "../domain/identities/types";
import { OrganizationId, ServiceId } from "../domain/clients/types";
import { DomainError, makeNotFoundError } from "../domain/types";

export type FindGrantUseCaseError = DomainError;

/**
 * Given a grant identifier return the detail
 */
export const FindGrantUseCase =
  (logger: Logger, grantService: GrantService) =>
  (
    organizationId: OrganizationId,
    serviceId: ServiceId,
    identityId: IdentityId
  ): TE.TaskEither<FindGrantUseCaseError, Grant> =>
    pipe(
      grantService.findBy({
        clientId: O.some({ organizationId, serviceId }),
        identityId,
        remember: true,
      }),
      TE.map(RA.head),
      TE.fold(
        (error) => {
          logger.error("Some error during FindGrantUseCase", error.causedBy);
          return TE.left(error);
        },
        O.fold(
          () => TE.left(makeNotFoundError("Grant not found")),
          (grant) => TE.right(grant)
        )
      )
    );
export type FindGrantUseCase = ReturnType<typeof FindGrantUseCase>;
