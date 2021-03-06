import * as TE from "fp-ts/TaskEither";
import { constVoid, pipe } from "fp-ts/function";
import { some } from "fp-ts/lib/Option";
import * as RA from "fp-ts/ReadonlyArray";
import { OrganizationId, ServiceId } from "../domain/clients/types";
import { GrantService } from "../domain/grants/GrantService";
import { Logger } from "../domain/logger";
import { DomainError, makeNotFoundError } from "../domain/types";
import { IdentityId } from "../domain/identities/types";
import { show } from "../domain/utils";

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
