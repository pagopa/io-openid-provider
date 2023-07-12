import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { flow, pipe } from "fp-ts/lib/function";
import { strings } from "@pagopa/ts-commons";
import { DomainErrorTypes, makeDomainError } from "../../domain/types";
import { IdentityService } from "../../domain/identities/IdentityService";
import * as authClient from "../../generated/clients/io-auth/client";
import { AccessToken, IdentityId } from "../../domain/identities/types";
import { Logger } from "../../domain/logger";
import { show } from "../../domain/utils";

const authenticate =
  (logger: Logger, client: authClient.Client) => (token: AccessToken) =>
    pipe(
      TE.tryCatch(
        () => client.getUserIdentity({ Bearer: `Bearer ${token}` }),
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
              acr: undefined,
              authTime: undefined,
              dateOfBirth: undefined,
              email: undefined,
              familyName: response.value.family_name,
              fiscalCode: response.value
                .fiscal_code as unknown as strings.NonEmptyString,
              givenName: response.value.name,
              id: response.value.fiscal_code as unknown as IdentityId,
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
