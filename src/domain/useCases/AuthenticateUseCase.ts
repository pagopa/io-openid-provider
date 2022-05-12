import { flow, pipe } from "fp-ts/lib/function";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { IdentityService } from "../identities/IdentityService";
import { AccessToken, Identity } from "../identities/types";
import { Logger } from "../logger";
import { show } from "../utils";
import { unauthorizedError, UnauthorizedError } from "../types";

type AuthenticateUseCaseError = UnauthorizedError;

/**
 * Given an accessToken (could be invalid), return the Identity
 * which the accessToken belongs to
 */
export const AuthenticateUseCase =
  (logger: Logger, identityService: IdentityService) =>
  (
    accessToken: string | undefined
  ): TE.TaskEither<AuthenticateUseCaseError, Identity> =>
    pipe(
      TE.fromEither(
        pipe(
          // validate the token
          AccessToken.decode(accessToken),
          E.mapLeft((_) => {
            logger.info("AuthenticateUseCase: invalid access-token");
            return unauthorizedError;
          })
        )
      ),
      // given the token validate it, then returns the identity if any
      TE.chain(
        flow(
          identityService.authenticate,
          TE.bimap(
            (err) => {
              logger.error(`Error AuthenticateUseCase: ${show(err)}`, err);
              return unauthorizedError;
            },
            (identity) => {
              logger.info(`AuthenticateUseCase: ${show(identity)}`);
              return identity;
            }
          )
        )
      )
    );
