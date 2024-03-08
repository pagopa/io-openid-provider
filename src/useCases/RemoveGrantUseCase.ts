import * as TE from "fp-ts/lib/TaskEither.js";
import { constVoid, pipe } from "fp-ts/lib/function.js";
import { some } from "fp-ts/lib/Option.js";
import * as RA from "fp-ts/lib/ReadonlyArray.js";
import { OrganizationId, ServiceId } from "../domain/clients/types.js";
import { GrantService } from "../domain/grants/GrantService.js";
import { Logger } from "../domain/logger/index.js";
import { DomainError, makeNotFoundError } from "../domain/types/index.js";
import { IdentityId } from "../domain/identities/types.js";
import { show } from "../domain/utils.js";

export type RemoveGrantUseCaseError = DomainError;

/**
 * Given a selector return a list of client that matches the given selector
 */
export const RemoveGrantUseCase =
  (logger: Logger, grantService: GrantService) =>
  (
    organizationId: OrganizationId,
    serviceId: ServiceId,
    identityId: IdentityId
  ): TE.TaskEither<RemoveGrantUseCaseError, void> =>
    pipe(
      grantService.findBy({
        clientId: some({ organizationId, serviceId }),
        identityId,
        remember: true,
      }),
      TE.map(RA.map((grant) => grantService.remove(identityId, grant.id))),
      TE.chain(RA.sequence(TE.ApplicativePar)),
      TE.fold(
        (error) => {
          logger.error(`RemoveGrantUseCase error; ${show(error)}`, error);
          return TE.left(error);
        },
        (results) =>
          RA.isEmpty(results)
            ? TE.left(makeNotFoundError("Grant not found"))
            : TE.right(constVoid())
      )
    );
export type RemoveGrantUseCase = ReturnType<typeof RemoveGrantUseCase>;
