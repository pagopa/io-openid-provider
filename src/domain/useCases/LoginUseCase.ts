import { flow, pipe } from "fp-ts/lib/function";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { IdentityService } from "../identities/IdentityService";
import { AccessToken, Identity } from "../identities/types";
import { Logger } from "../logger";
import { show } from "../utils";

export type LoginUseCaseError = "Unauthorized" | string;

/**
 * Given an accessToken (could be invalid), return the Identity
 * which the accessToken belongs to
 */
export const LoginUseCase =
  (logger: Logger, identityService: IdentityService) =>
  (
    accessToken: string | undefined
  ): TE.TaskEither<LoginUseCaseError, Identity> =>
    pipe(
      TE.fromEither(
        pipe(
          // validate the token
          AccessToken.decode(accessToken),
          E.mapLeft((_) => "Unauthorized")
        )
      ),
      // given the token validate it, then returns the identity if any
      TE.chain(
        flow(
          identityService.authenticate,
          TE.bimap(
            (err) => {
              logger.error(`Error LoginUseCase: ${show(err)}`, err);
              return "Unauthorized";
            },
            (identity) => {
              logger.info(`LoginUserCase: ${show(identity)}`);
              return identity;
            }
          )
        )
      )
    );
