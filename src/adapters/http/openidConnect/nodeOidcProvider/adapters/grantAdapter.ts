import * as oidc from "oidc-provider";
import { Logger } from "../../../../../domain/logger/index.js";
import { GrantService } from "../../../../../domain/grants/GrantService.js";
import { Grant } from "../../../../../domain/grants/types.js";
import {
  makeNotImplementedAdapter,
  findFromTEO,
  destroyFromTE,
  IdentityIdAndGrantId,
  DateFromNumericDate,
} from "../utils.js";

export const grantToAdapterPayload = (entity: Grant): oidc.AdapterPayload => ({
  accountId: entity.subjects.identityId,
  clientId: Grant.props.subjects.props.clientId.encode(
    entity.subjects.clientId
  ),
  exp: DateFromNumericDate.encode(entity.expireAt),
  iat: DateFromNumericDate.encode(entity.issuedAt),
  jti: IdentityIdAndGrantId.encode([entity.subjects.identityId, entity.id]),
  kind: "Grant",
  loginTs: DateFromNumericDate.encode(entity.issuedAt),
  openid: {
    scope: entity.scope,
  },
});

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
});
