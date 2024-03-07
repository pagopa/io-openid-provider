import { CosmosErrors } from "@pagopa/io-functions-commons/dist/src/utils/cosmosdb_model.js";
import * as t from "io-ts";
import * as PR from "io-ts/lib/PathReporter.js";

export enum DomainErrorTypes {
  GENERIC_ERROR = "GENERIC_ERROR",
  NOT_FOUND = "NOT_FOUND",
  NOT_IMPLEMENTED = "NOT_IMPLEMENTED",
  FORMAT_ERROR = "FORMAT_ERROR",
  UNAUTHORIZED = "UNAUTHORIZED",
}

export interface BaseError {
  readonly causedBy: Error | undefined;
}

export type NotFoundError = BaseError & {
  readonly kind: DomainErrorTypes.NOT_FOUND;
};
export const makeNotFoundError = (msg: string): NotFoundError => ({
  causedBy: new Error(msg),
  kind: DomainErrorTypes.NOT_FOUND,
});
export type NotImplementedError = BaseError & {
  readonly kind: DomainErrorTypes.NOT_IMPLEMENTED;
};
export type UnauthorizedError = BaseError & {
  readonly kind: DomainErrorTypes.UNAUTHORIZED;
};
export const unauthorizedError: UnauthorizedError = {
  causedBy: undefined,
  kind: DomainErrorTypes.UNAUTHORIZED,
};
export type FormatError = BaseError & {
  readonly kind: DomainErrorTypes.FORMAT_ERROR;
};
export const formatError: FormatError = {
  causedBy: undefined,
  kind: DomainErrorTypes.FORMAT_ERROR,
};
export type GenericError = BaseError & {
  readonly kind: DomainErrorTypes.GENERIC_ERROR;
};

/**
 * This type represents an error, any services and function of the core
 * package should use this as Error rappresentation
 */
export type DomainError =
  | NotFoundError
  | NotImplementedError
  | FormatError
  | UnauthorizedError
  | GenericError;

/**
 * Create a [[DomaniError]] given a [[t.Errors]] or a message
 */
export const makeDomainError = (
  e: t.Errors | Error | string,
  kind: DomainErrorTypes = DomainErrorTypes.GENERIC_ERROR
): DomainError => {
  if (t.string.is(e)) {
    return {
      causedBy: new Error(e),
      kind,
    };
  } else if (e instanceof Error) {
    return {
      causedBy: e,
      kind,
    };
  } else {
    return {
      causedBy: new Error(PR.failure(e).join("\n")),
      kind,
    };
  }
};

export const cosmosErrorsToDomainError = (
  e: Error | CosmosErrors
): DomainError => {
  if (e instanceof Error) {
    return {
      causedBy: e,
      kind: DomainErrorTypes.GENERIC_ERROR,
    };
  }
  switch (e.kind) {
    case "COSMOS_EMPTY_RESPONSE":
      return {
        causedBy: new Error(),
        kind: DomainErrorTypes.NOT_FOUND,
      };
    case "COSMOS_DECODING_ERROR":
      return {
        causedBy: new Error(PR.failure(e.error).join("\n")),
        kind: DomainErrorTypes.FORMAT_ERROR,
      };
    case "COSMOS_ERROR_RESPONSE":
      return {
        causedBy: e.error,
        kind: DomainErrorTypes.GENERIC_ERROR,
      };
    default:
      return {
        causedBy: new Error(),
        kind: DomainErrorTypes.GENERIC_ERROR,
      };
  }
};
