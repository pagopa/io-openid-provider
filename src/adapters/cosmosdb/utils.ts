// import { constVoid } from "fp-ts/lib/function.js";
import * as t from "io-ts";
import { pipe } from "fp-ts/lib/function.js";
import * as O from "fp-ts/lib/Option.js";
import * as E from "fp-ts/lib/Either.js";
import * as TE from "fp-ts/lib/TaskEither.js";
import * as PR from "io-ts/lib/PathReporter.js";
import { CosmosErrors } from "@pagopa/io-functions-commons/dist/src/utils/cosmosdb_model.js";
import { Ttl } from "@pagopa/io-functions-commons/dist/src/utils/cosmosdb_model_ttl.js";
import { Logger } from "../../domain/logger/index.js";
import {
  DomainError,
  cosmosErrorsToDomainError,
} from "../../domain/types/index.js";
import { show } from "../../domain/utils.js";

export const makeTE =
  (logger: Logger) =>
  <T0, T1>(
    operationName: string,
    decode: (t0: T0) => t.Validation<T1>,
    fn: () => TE.TaskEither<CosmosErrors, T0>
  ): TE.TaskEither<DomainError, T1> =>
    pipe(
      fn(),
      TE.chainW((res) =>
        pipe(
          TE.fromEither(decode(res)),
          TE.mapLeft((e) => new Error(PR.failure(e).join("\n")))
        )
      ),
      TE.mapLeft((err) => {
        logger.error(`Error on ${operationName} ${show(err)}`, err);
        return cosmosErrorsToDomainError(err);
      })
    );

export const makeTEOption =
  (logger: Logger) =>
  <T0, T1>(
    operationName: string,
    decode: (t0: T0) => t.Validation<T1>,
    fn: () => TE.TaskEither<CosmosErrors, O.Option<T0>>
  ): TE.TaskEither<DomainError, O.Option<T1>> => {
    const decodeOpt = (t0: O.Option<T0>) =>
      pipe(
        t0,
        O.fold(
          () => E.right(O.none),
          (some) => pipe(decode(some), E.map(O.some))
        )
      );
    return makeTE(logger)(operationName, decodeOpt, fn);
  };

export const getTTL = (expireData: Date, createdDate: Date): Ttl =>
  Math.ceil((expireData.getTime() - createdDate.getTime()) / 1000) as Ttl;
