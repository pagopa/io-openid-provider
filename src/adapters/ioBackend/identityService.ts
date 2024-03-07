import * as E from "fp-ts/lib/Either.js";
import * as TE from "fp-ts/lib/TaskEither.js";
import { flow, pipe } from "fp-ts/lib/function.js";
import {
  DomainError,
  DomainErrorTypes,
  makeDomainError,
} from "../../domain/types/index.js";
import { IdentityService } from "../../domain/identities/IdentityService.js";
import * as authClient from "../../generated/clients/io-auth/client.js";
import { AccessToken, Identity } from "../../domain/identities/types.js";
import { Logger } from "../../domain/logger/index.js";
import { show } from "../../domain/utils.js";

const authenticate =
  (logger: Logger, client: authClient.Client) =>
  (token: AccessToken): TE.TaskEither<DomainError, Identity> =>
    pipe(
      TE.tryCatch(
        () => client.getUserForFIMS({ Bearer: `Bearer ${token}` }),
        (_) => {
          logger.debug(`authenticate getUserIdentity: ${_}`);
          return makeDomainError("Unexpected", DomainErrorTypes.GENERIC_ERROR);
        }
      ),
      TE.map((response) => {
        logger.debug(`authenticate getUserIdentity: ${show(response)}`);
        return response;
      }),
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
