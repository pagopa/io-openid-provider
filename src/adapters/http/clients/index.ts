import express from "express";
import { pipe } from "fp-ts/lib/function.js";
import * as O from "fp-ts/lib/Option.js";
import * as RA from "fp-ts/lib/ReadonlyArray.js";
import * as TE from "fp-ts/lib/TaskEither.js";
import { responses } from "@pagopa/ts-commons";
import {
  withRequestMiddlewares,
  wrapRequestHandler,
} from "@pagopa/ts-commons/lib/request_middleware.js";
import { OptionalQueryParamMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/optional_query_param.js";
import { APIClientList } from "../../../generated/definitions/APIClientList.js";
import { APIClientDetail } from "../../../generated/definitions/APIClientDetail.js";
import {
  Client,
  OrganizationId,
  ServiceId,
} from "../../../domain/clients/types.js";
import { ClientListUseCase } from "../../../useCases/ClientListUseCase.js";

const makeAPIClientDetail = (input: Client): APIClientDetail => ({
  client_id: Client.props.clientId.encode(input.clientId),
  client_id_issued_at: input.issuedAt.toUTCString(),
  client_name: input.name,
  grant_types: input.grantTypes,
  organization_id: input.clientId.organizationId,
  redirect_uris: input.redirectUris,
  response_types: input.responseTypes,
  scope: input.scope,
  service_id: input.clientId.serviceId,
});

const makeAPIClientList = (input: ReadonlyArray<Client>): APIClientList => ({
  items: pipe(input, RA.map(makeAPIClientDetail)),
});

type GetClientListEndpointHandler =
  | responses.IResponseSuccessJson<APIClientList>
  | responses.IResponseErrorInternal;

const getClientListEndpointHandler =
  (clientListUseCase: ClientListUseCase) =>
  (
    organizationId: O.Option<OrganizationId>,
    serviceId: O.Option<ServiceId>
  ): Promise<GetClientListEndpointHandler> =>
    pipe(
      clientListUseCase({ organizationId, serviceId }),
      TE.bimap(
        () => responses.ResponseErrorInternal("Internal Error"),
        (r) => responses.ResponseSuccessJson(makeAPIClientList(r))
      ),
      TE.toUnion
    )();

/**
 * Return the router that manage the
 * endpoint related to the clients
 */
export const makeRouter = (
  clientListUseCase: ClientListUseCase
): express.Router => {
  const router = express.Router();

  router.get(
    "/clients",
    wrapRequestHandler(
      withRequestMiddlewares(
        OptionalQueryParamMiddleware("organizationId", OrganizationId),
        OptionalQueryParamMiddleware("serviceId", ServiceId)
      )(getClientListEndpointHandler(clientListUseCase))
    )
  );

  return router;
};
