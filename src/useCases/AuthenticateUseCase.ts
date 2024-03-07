import { flow, pipe } from "fp-ts/lib/function.js";
import * as E from "fp-ts/lib/Either.js";
import * as TE from "fp-ts/lib/TaskEither.js";
import { IdentityService } from "../domain/identities/IdentityService.js";
import { AccessToken, Identity } from "../domain/identities/types.js";
import { Logger } from "../domain/logger/index.js";
import { show } from "../domain/utils.js";
import { unauthorizedError, UnauthorizedError } from "../domain/types/index.js";

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
export type AuthenticateUseCase = ReturnType<typeof AuthenticateUseCase>;
