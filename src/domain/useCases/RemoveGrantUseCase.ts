import * as TE from "fp-ts/TaskEither";
import { constVoid, pipe } from "fp-ts/function";
import { some } from "fp-ts/lib/Option";
import * as RA from "fp-ts/ReadonlyArray";
import { OrganizationId, ServiceId } from "../clients/types";
import { GrantService } from "../grants/GrantService";
import { Logger } from "../logger";
import { DomainErrorTypes } from "../types";
import { IdentityId } from "../identities/types";
import { show } from "../utils";

export type RemoveGrantError = DomainErrorTypes;
export const RemoveGrantError = DomainErrorTypes;

/**
 * Given a selector return a list of client that matches the given selector
 */
export const RemoveGrantUseCase =
  (logger: Logger, grantService: GrantService) =>
  (
    organizationId: OrganizationId,
    serviceId: ServiceId,
    identityId: IdentityId
  ): TE.TaskEither<RemoveGrantError, void> =>
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
          return TE.left(error.kind);
        },
        (results) =>
          RA.isEmpty(results)
            ? TE.left(RemoveGrantError.NOT_FOUND)
            : TE.right(constVoid())
      )
    );
