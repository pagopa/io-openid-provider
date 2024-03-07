import { pipe } from "fp-ts/lib/function.js";
import { Option } from "fp-ts/lib/Option.js";
import * as TE from "fp-ts/lib/TaskEither.js";
import {
  DomainError,
  DomainErrorTypes,
  makeDomainError,
} from "./types/index.js";

export const show = <T>(_: T) => JSON.stringify(_, null, 2);

/**
 * Given a Task<Either<L, Option<R>>> return a Task<Either<L, R>>
 */
export const fromTEOtoTE = <T>(
  teo: TE.TaskEither<DomainError, Option<T>>
): TE.TaskEither<DomainError, T> =>
  pipe(
    teo,
    TE.chain(
      TE.fromOption(() =>
        makeDomainError("Not Found", DomainErrorTypes.NOT_FOUND)
      )
    )
  );
