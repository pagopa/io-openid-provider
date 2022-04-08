import express from "express";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as RA from "fp-ts/ReadonlyArray";
import * as TE from "fp-ts/TaskEither";
import { responses } from "@pagopa/ts-commons";
import {
  withRequestMiddlewares,
  wrapRequestHandler,
} from "@pagopa/ts-commons/lib/request_middleware";
import { OptionalQueryParamMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/optional_query_param";
import { APIClientList } from "src/generated/definitions/APIClientList";
import { APIClientDetail } from "src/generated/definitions/APIClientDetail";
import { ClientRepository } from "../../core/repositories/ClientRepository";
import { Logger } from "../../logger";
import { Client, OrganizationId, ServiceId } from "../../core/domain";

const makeAPIClientDetail = (input: Client): APIClientDetail => ({
  application_type: input.applicationType,
  client_id: input.clientId,
  client_id_issued_at: input.issuedAt.toString(),
  client_name: input.name,
  grant_types: input.grantTypes,
  // FIXME: populate this field
  logo_uri: undefined,
  organization_id: input.organizationId,
  redirect_uris: input.redirectUris,
  response_types: input.responseTypes,
  scope: input.scope,
  service_id: input.serviceId,
  subject_type: input.subjectType,
});

const makeAPIClientList = (input: ReadonlyArray<Client>): APIClientList => ({
  items: pipe(input, RA.map(makeAPIClientDetail)),
});

type GetClientListEndpointHandler =
  | responses.IResponseSuccessJson<APIClientList>
  | responses.IResponseErrorInternal;

const getClientListEndpointHandler =
  (_logger: Logger, clientRepository: ClientRepository) =>
  (
    organizationId: O.Option<OrganizationId>,
    serviceId: O.Option<ServiceId>
  ): Promise<GetClientListEndpointHandler> => {
    const selector = {
      organizationId: O.toUndefined(organizationId),
      serviceId: O.toUndefined(serviceId),
    };
    return pipe(
      clientRepository.list(selector),
      TE.bimap(
        (_) => responses.ResponseErrorInternal("hello"),
        (r) => responses.ResponseSuccessJson(makeAPIClientList(r))
      ),
      TE.toUnion
    )();
  };

/**
 * Return the router that manage the
 * endpoint related to the clients
 */
export const makeRouter = (
  logger: Logger,
  clientRepository: ClientRepository
): express.Router => {
  const router = express.Router();

  router.get(
    "/admin/clients",
    wrapRequestHandler(
      withRequestMiddlewares(
        OptionalQueryParamMiddleware("organizationId", OrganizationId),
        OptionalQueryParamMiddleware("serviceId", ServiceId)
      )(getClientListEndpointHandler(logger, clientRepository))
    )
  );

  return router;
};
