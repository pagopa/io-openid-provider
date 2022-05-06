import * as oidc from "oidc-provider";
import * as t from "io-ts";
import { pipe } from "fp-ts/function";
import * as E from "fp-ts/Either";
import { Logger } from "../../../../../domain/logger";
import { GrantService } from "../../../../../domain/grants/GrantService";
import { Grant } from "../../../../../domain/grants/types";
import { Client, ClientId } from "../../../../../domain/clients/types";
import {
  makeNotImplementedAdapter,
  findFromTEO,
  destroyFromTE,
  upsertFromTE,
  IdentityIdAndGrantId,
  DateFromNumericDate,
} from "../utils";

export const grantToAdapterPayload = (entity: Grant): oidc.AdapterPayload => ({
  accountId: entity.subjects.identityId,
  clientId: entity.subjects.clientId,
  exp: DateFromNumericDate.encode(entity.expireAt),
  iat: DateFromNumericDate.encode(entity.issuedAt),
  jti: IdentityIdAndGrantId.encode([entity.subjects.identityId, entity.id]),
  kind: "Grant",
  loginTs: DateFromNumericDate.encode(entity.issuedAt),
  openid: {
    scope: entity.scope,
  },
});

const adapterPayloadToGrant = (
  payload: oidc.AdapterPayload
): t.Validation<Grant> =>
  pipe(
    E.of(
      ([idnId, grnId]: IdentityIdAndGrantId) =>
        (clientId: ClientId) =>
        (exp: Date) =>
        (iat: Date) => ({
          expireAt: exp,
          id: grnId,
          issuedAt: iat,
          remember: undefined,
          scope: payload.openid?.scope,
          subjects: {
            clientId,
            identityId: idnId,
          },
        })
    ),
    E.ap(IdentityIdAndGrantId.decode(payload.jti)),
    E.ap(Client.props.clientId.decode(payload.clientId)),
    E.ap(DateFromNumericDate.decode(payload.exp)),
    E.ap(DateFromNumericDate.decode(payload.iat))
  );

export const makeGrantAdapter = (
  logger: Logger,
  grantService: GrantService
): oidc.Adapter => ({
  ...makeNotImplementedAdapter("Grant", logger),
  destroy: destroyFromTE(
    logger,
    "Grant",
    IdentityIdAndGrantId.decode,
    ([identityId, grantId]) => grantService.remove(identityId, grantId)
  ),
  find: findFromTEO(
    logger,
    "Grant",
    IdentityIdAndGrantId.decode,
    grantToAdapterPayload,
    ([identityId, grantId]) => grantService.find(identityId, grantId)
  ),
  upsert: upsertFromTE(
    logger,
    "Grant",
    adapterPayloadToGrant,
    grantService.upsert
  ),
});
