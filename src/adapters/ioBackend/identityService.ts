import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";
import {
  DomainError,
  DomainErrorTypes,
  makeDomainError,
} from "../../domain/types";
import { IdentityService } from "../../domain/identities/IdentityService";
import * as authClient from "../../generated/clients/io-auth/client";
import { AccessToken, Identity } from "../../domain/identities/types";
import { Logger } from "../../domain/logger";
import { show } from "../../domain/utils";

const authenticate =
  (logger: Logger, client: authClient.Client) =>
  (token: AccessToken): TE.TaskEither<DomainError, Identity> =>
    pipe(
      TE.tryCatch(
        () => client.getUserForFIMS({ Bearer: `Bearer ${token}` }),
        (_) => makeDomainError("Unexpected", DomainErrorTypes.GENERIC_ERROR)
      ),
      TE.chainEitherK(
        flow(
          E.mapLeft((_) =>
            makeDomainError("Decoding error", DomainErrorTypes.GENERIC_ERROR)
          )
        )
      ),
      TE.chainFirst((response) =>
        TE.of(logger.debug(`authenticate response: ${show(response)}`))
      ),
      TE.orElseFirst((error) =>
        TE.of(logger.error(`authenticate error: ${show(error)}`))
      ),
      TE.chainEitherK((response) => {
        switch (response.status) {
          case 200:
            return E.right({
              acr: response.value.acr,
              authTime: new Date(response.value.auth_time * 1000),
              dateOfBirth: response.value.date_of_birth,
              email: response.value.email,
              familyName: response.value.family_name,
              fiscalCode: response.value
                .fiscal_code as unknown as Identity["fiscalCode"],
              givenName: response.value.name,
              id: response.value.fiscal_code as unknown as Identity["id"],
            });
          case 400:
            return E.left(
              makeDomainError("400", DomainErrorTypes.GENERIC_ERROR)
            );
          case 401:
            return E.left(
              makeDomainError("401", DomainErrorTypes.GENERIC_ERROR)
            );
          case 500:
          default:
            return E.left(
              makeDomainError("Bad Request", DomainErrorTypes.GENERIC_ERROR)
            );
        }
      })
    );

/**
 * Create an instance of IdentityService from a io AuthClient
 */
export const makeIdentityService = (
  logger: Logger,
  client: authClient.Client
): IdentityService => ({
  authenticate: authenticate(logger, client),
});
