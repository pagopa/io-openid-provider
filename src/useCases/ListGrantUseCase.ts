import * as O from "fp-ts/lib/Option.js";
import * as TE from "fp-ts/lib/TaskEither.js";
import { GrantService } from "../domain/grants/GrantService.js";
import { Grant } from "../domain/grants/types.js";
import { DomainError } from "../domain/types/index.js";
import { IdentityId } from "../domain/identities/types.js";

export type ListGrantUseCaseError = DomainError;

export const ListGrantUseCase =
  (grantService: GrantService) =>
  (
    identityId: IdentityId
  ): TE.TaskEither<ListGrantUseCaseError, ReadonlyArray<Grant>> =>
    grantService.findBy({
      clientId: O.none,
      identityId,
      remember: true,
    });
export type ListGrantUseCase = ReturnType<typeof ListGrantUseCase>;
