import { pipe } from "fp-ts/lib/function.js";
import * as O from "fp-ts/lib/Option.js";
import * as RA from "fp-ts/lib/ReadonlyArray.js";
import * as TE from "fp-ts/lib/TaskEither.js";
import { Logger } from "../domain/logger/index.js";
import { GrantService } from "../domain/grants/GrantService.js";
import { Grant } from "../domain/grants/types.js";
import { IdentityId } from "../domain/identities/types.js";
import { OrganizationId, ServiceId } from "../domain/clients/types.js";
import { DomainError, makeNotFoundError } from "../domain/types/index.js";

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
