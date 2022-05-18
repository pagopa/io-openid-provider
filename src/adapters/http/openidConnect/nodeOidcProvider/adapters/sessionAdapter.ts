import * as oidc from "oidc-provider";
import * as t from "io-ts";
import { pipe } from "fp-ts/function";
import * as E from "fp-ts/Either";
import { Logger } from "../../../../../domain/logger";
import { SessionService } from "../../../../../domain/sessions/SessionService";
import { Session, SessionId, Uid } from "../../../../../domain/sessions/types";
import {
  makeNotImplementedAdapter,
  findFromTEO,
  destroyFromTE,
  upsertFromTE,
  DateFromNumericDate,
} from "../utils";

const sessionToAdapterPayload = (entity: Session): oidc.AdapterPayload => ({
  accountId: entity.identityId,
  exp: DateFromNumericDate.encode(entity.expireAt),
  iat: DateFromNumericDate.encode(entity.issuedAt),
  jti: entity.id,
  kind: "Session",
  loginTs: DateFromNumericDate.encode(entity.issuedAt),
  uid: entity.uid,
});

const adapterPayloadToSession = (
  payload: oidc.AdapterPayload
): t.Validation<Session> =>
  pipe(
    E.of(
      (id: SessionId) =>
        (identityId: Session["identityId"]) =>
        (uid: Session["uid"]) =>
        (exp: Date) =>
        (iat: Date) => ({
          expireAt: exp,
          id,
          identityId,
          issuedAt: iat,
          kind: payload.kind,
          uid,
        })
    ),
    E.ap(SessionId.decode(payload.jti)),
    E.ap(Session.props.identityId.decode(payload.accountId)),
    E.ap(Session.props.uid.decode(payload.uid)),
    E.ap(DateFromNumericDate.decode(payload.exp)),
    E.ap(DateFromNumericDate.decode(payload.iat))
  );

export const makeSessionAdapter = (
  logger: Logger,
  sessionService: SessionService
): oidc.Adapter => ({
  ...makeNotImplementedAdapter("Session", logger),
  destroy: destroyFromTE(
    logger,
    "Session",
    SessionId.decode,
    sessionService.remove
  ),
  find: findFromTEO(
    logger,
    "Session",
    SessionId.decode,
    sessionToAdapterPayload,
    sessionService.find
  ),
  findByUid: findFromTEO(
    logger,
    "Session uid",
    Uid.decode,
    sessionToAdapterPayload,
    sessionService.findByUid
  ),
  upsert: upsertFromTE(
    logger,
    "Session",
    adapterPayloadToSession,
    sessionService.upsert
  ),
});
