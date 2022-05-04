import * as t from "io-ts";
import * as PR from "io-ts/PathReporter";

export enum DomainErrorTypes {
  GENERIC_ERROR = "GENERIC_ERROR",
  NOT_FOUND = "NOT_FOUND",
  NOT_IMPLEMENTED = "NOT_IMPLEMENTED",
}

export const DomainError = t.type({
  causedBy: t.union([
    t.type({
      message: t.string,
      name: t.string,
    }),
    t.undefined,
  ]),
  kind: t.union([
    t.literal(DomainErrorTypes.GENERIC_ERROR),
    t.literal(DomainErrorTypes.NOT_FOUND),
    t.literal(DomainErrorTypes.NOT_IMPLEMENTED),
  ]),
});

/**
 * This type represents an error, any services and function of the core
 * package should use this as Error rappresentation
 */
export type DomainError = t.TypeOf<typeof DomainError>;

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
