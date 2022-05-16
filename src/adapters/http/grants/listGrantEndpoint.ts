import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/TaskEither";
import { responses } from "@pagopa/ts-commons";
import { Grant } from "../../../domain/grants/types";
import { FiscalCode } from "../../../generated/definitions/FiscalCode";
import { APIGrantList } from "../../../generated/definitions/APIGrantList";
import { ListGrantUseCase } from "../../../useCases/ListGrantUseCase";
import { IdentityId } from "../../../domain/identities/types";
import { DomainErrorTypes } from "../../../domain/types";
import { makeAPIGrant } from "./findGrantEndpoint";

const makeAPIGrantList = (list: ReadonlyArray<Grant>): APIGrantList => ({
  items: list.map(makeAPIGrant),
});

type ListGrantEndpoint =
  | responses.IResponseSuccessJson<APIGrantList>
  | responses.IResponseErrorValidation
  | responses.IResponseErrorInternal;

export const listGrantEndpoint =
  (listGrantUseCase: ListGrantUseCase) =>
  (identityId: FiscalCode): Promise<ListGrantEndpoint> =>
    pipe(
      listGrantUseCase(identityId as IdentityId),
      TE.bimap(
        (error) => {
          switch (error.kind) {
            case DomainErrorTypes.NOT_FOUND:
            case DomainErrorTypes.GENERIC_ERROR:
            case DomainErrorTypes.NOT_IMPLEMENTED:
            default:
              return responses.ResponseErrorInternal("Internal Error");
          }
        },
        (result) => responses.ResponseSuccessJson(makeAPIGrantList(result))
      ),
      TE.toUnion
    )();
