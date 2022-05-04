import * as oidc from "oidc-provider";
import * as t from "io-ts";
import { pipe } from "fp-ts/function";
import * as E from "fp-ts/Either";
import { Logger } from "../../../../../domain/logger";
import { GrantService } from "../../../../../domain/grants/GrantService";
import { Grant, GrantId } from "../../../../../domain/grants/types";
import {
  makeNotImplementedAdapter,
  findFromTEO,
  destroyFromTE,
  upsertFromTE,
  DateFromNumericDate,
} from "../utils";

const grantToAdapterPayload = (entity: Grant): oidc.AdapterPayload => ({
  accountId: entity.subjects.identityId,
  clientId: Grant.props.subjects.props.clientId.encode(
    entity.subjects.clientId
  ),
  exp: DateFromNumericDate.encode(entity.expireAt),
  iat: DateFromNumericDate.encode(entity.issuedAt),
  jti: entity.id,
  kind: "Grant",
  loginTs: DateFromNumericDate.encode(entity.issuedAt),
  openid: {
    scope: entity.scope,
    // claims?: string[] | undefined;
  },
  // resources?: {
  //     [resource: string]: string;
  // } | undefined;
  // rejected?: Pick<Grant, 'openid' | 'resources'> | undefined;
});

const adapterPayloadToGrant = (
  payload: oidc.AdapterPayload
): t.Validation<Grant> =>
  pipe(
    E.of(
      (exp: Date) => (iat: Date) =>
        Grant.decode({
          expireAt: exp,
          id: payload.jti,
          issuedAt: iat,
          scope: payload.openid?.scope,
          subjects: {
            clientId: payload.clientId,
            identityId: payload.accountId,
          },
        })
    ),
    E.ap(DateFromNumericDate.decode(payload.exp)),
    E.ap(DateFromNumericDate.decode(payload.iat)),
    E.flatten
  );

export const makeGrantAdapter = (
  logger: Logger,
  grantService: GrantService
): oidc.Adapter => ({
  ...makeNotImplementedAdapter("Grant", logger),
  destroy: destroyFromTE(logger, "Grant", GrantId.decode, grantService.remove),
  find: findFromTEO(
    logger,
    "Grant",
    GrantId.decode,
    grantToAdapterPayload,
    grantService.find
  ),
  upsert: upsertFromTE(
    logger,
    "Grant",
    adapterPayloadToGrant,
    grantService.upsert
  ),
});
