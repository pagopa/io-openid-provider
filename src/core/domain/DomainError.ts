import * as t from "io-ts";
import * as PR from "io-ts/PathReporter";

export enum DomainErrorTypes {
  GENERIC_ERROR,
  NOT_IMPLEMENTED,
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
    t.literal(DomainErrorTypes.NOT_IMPLEMENTED),
  ]),
});

/**
 * This type represents an error, any services and function of the core
 * package should use this as Error rappresentation
 */
export type DomainError = t.TypeOf<typeof DomainError>;

/**
 * Create a [[DomaniError]] given a [[t.Errors]]
 */
export const makeDomainError = (e: t.Errors): DomainError => ({
  causedBy: new Error(PR.failure(e).join("\n")),
  kind: DomainErrorTypes.GENERIC_ERROR,
});
