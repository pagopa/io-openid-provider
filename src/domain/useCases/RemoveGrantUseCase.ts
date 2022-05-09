import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/function";
import { some } from "fp-ts/lib/Option";
import * as RA from "fp-ts/ReadonlyArray";
import { ClientService } from "../clients/ClientService";
import { OrganizationId, ServiceId } from "../clients/types";
import { GrantService } from "../grants/GrantService";
import { Logger } from "../logger";
import { DomainErrorTypes, makeDomainError } from "../types";
import { IdentityId } from "../identities/types";
import { show } from "../utils";

export type RemoveGrantError = DomainErrorTypes;

/**
 * Given a selector return a list of client that matches the given selector
 */
export const RemoveGrantUseCase =
  (logger: Logger, grantService: GrantService, clientService: ClientService) =>
  (
    organizationId: OrganizationId,
    serviceId: ServiceId,
    identityId: IdentityId
  ): TE.TaskEither<RemoveGrantError, void> =>
    pipe(
      clientService.list({
        organizationId: some(organizationId),
        serviceId: some(serviceId),
      }),
      TE.map(RA.head),
      TE.chain(
        TE.fromOption(() => makeDomainError("", DomainErrorTypes.NOT_FOUND))
      ),
      TE.chain((client) =>
        grantService.findBy({
          clientId: some(client.clientId),
          identityId,
          remember: true,
        })
      ),
      TE.map(RA.map((grant) => grantService.remove(grant.id))),
      TE.chain(RA.sequence(TE.ApplicativePar)),
      TE.map((_) => void 0),
      TE.mapLeft((error) => {
        logger.error(`RemoveGrantUseCase error; ${show(error)}`, error);
        return error.kind;
      })
    );
