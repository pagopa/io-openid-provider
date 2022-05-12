// TODO: Move this file into io-functions-commons
import { IRequestMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/request_middleware";
import * as t from "io-ts";
import * as E from "fp-ts/Either";
import { ResponseErrorFromValidationErrors } from "@pagopa/ts-commons/lib/responses";
import { pipe } from "fp-ts/lib/function";

/**
 * Returns a request middleware that extract an optional
 * parameter in the request.header.
 *
 * @param name  The name of the header
 * @param type  The io-ts Type for validating the parameter
 */
export function RequiredHeaderMiddleware<S, A>(
  name: string,
  type: t.Type<A, S>
): IRequestMiddleware<"IResponseErrorValidation", A> {
  return (request) =>
    new Promise((resolve) => {
      const result = pipe(
        type.decode(request.header(name)),
        E.mapLeft(ResponseErrorFromValidationErrors(type))
      );
      resolve(result);
    });
}
