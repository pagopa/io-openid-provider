import * as O from "fp-ts/Option";
import * as TE from "fp-ts/TaskEither";
import { GrantService } from "../domain/grants/GrantService";
import { Grant } from "../domain/grants/types";
import { DomainError } from "../domain/types";
import { IdentityId } from "../domain/identities/types";

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
