// import { constVoid } from "fp-ts/lib/function";
import * as t from "io-ts";
import { pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import * as PR from "io-ts/PathReporter";
import { CosmosErrors } from "@pagopa/io-functions-commons/dist/src/utils/cosmosdb_model";
import { Logger } from "../../domain/logger";
import {
  DomainError,
  cosmosErrorsToDomainError,
  makeDomainError,
} from "../../domain/types";
import { show } from "../../domain/utils";

export const runAsTE =
  (logger: Logger) =>
  <T0, T1>(
    operationName: string,
    decode: (t0: T0) => t.Validation<T1>,
    fn: () => Promise<T0>
  ): TE.TaskEither<DomainError, T1> =>
    pipe(
      TE.tryCatch(() => fn(), E.toError),
      TE.chainW((res) => TE.fromEither(decode(res))),
      TE.mapLeft((err) => {
        logger.error(`Error on ${operationName} ${show(err)}`, err);
        return makeDomainError(err);
      })
    );

export const runAsTEO =
  (logger: Logger) =>
  <T0, T1>(
    operationName: string,
    decode: (t0: T0) => t.Validation<T1>,
    fn: () => Promise<T0 | null>
  ): TE.TaskEither<DomainError, O.Option<T1>> => {
    const decodeOpt = (t0: T0 | null) =>
      pipe(
        O.fromNullable(t0),
        O.fold(
          () => E.right(O.none),
          (some) => pipe(decode(some), E.map(O.some))
        )
      );
    return runAsTE(logger)(operationName, decodeOpt, fn);
  };

export const newRunAsTE =
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

export const newRunAsTEO =
  (logger: Logger) =>
  <T0, T1>(
    operationName: string,
    decode: (t0: T0) => t.Validation<T1>,
    fn: () => TE.TaskEither<CosmosErrors, O.Option<T0>>
  ): TE.TaskEither<DomainError, O.Option<T1>> => {
    // eslint-disable-next-line sonarjs/no-identical-functions
    const decodeOpt = (t0: O.Option<T0>) =>
      pipe(
        t0,
        O.fold(
          () => E.right(O.none),
          (some) => pipe(decode(some), E.map(O.some))
        )
      );
    return newRunAsTE(logger)(operationName, decodeOpt, fn);
  };
