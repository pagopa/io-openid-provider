import { pipe } from "fp-ts/lib/function.js";
import * as TE from "fp-ts/lib/TaskEither.js";
import { responses } from "@pagopa/ts-commons";
import { Grant } from "../../../domain/grants/types.js";
import { FiscalCode } from "../../../generated/definitions/FiscalCode.js";
import { APIGrantList } from "../../../generated/definitions/APIGrantList.js";
import { ListGrantUseCase } from "../../../useCases/ListGrantUseCase.js";
import { IdentityId } from "../../../domain/identities/types.js";
import { DomainErrorTypes } from "../../../domain/types/index.js";
import { makeAPIGrant } from "./findGrantEndpoint.js";

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
