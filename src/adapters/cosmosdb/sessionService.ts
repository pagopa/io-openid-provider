import { constVoid, pipe } from "fp-ts/lib/function";
import * as t from "io-ts";
import * as E from "fp-ts/Either";
import { Logger } from "../../domain/logger";
import { SessionService } from "../../domain/sessions/SessionService";
import { Session, SessionId, Uid } from "../../domain/sessions/types";
import { IdentityId } from "../../domain/identities/types";
import { getTTL, makeTE, makeTEOption } from "./utils";
import { CosmosSession, RetrievedSession, SessionModel } from "./model/session";

export const toRecord = (entity: Session): CosmosSession => ({
  expireAt: entity.expireAt,
  id: entity.id,
  identityId: entity.identityId || undefined,
  issuedAt: entity.issuedAt,
  ttl: getTTL(entity.expireAt, entity.issuedAt),
  uid: entity.uid,
});

export const fromRecord = (record: RetrievedSession): t.Validation<Session> =>
  pipe(
    E.of((id: SessionId) => (identityId: null | IdentityId) => (uid: Uid) => ({
      expireAt: record.expireAt,
      id,
      identityId: identityId || undefined,
      issuedAt: record.issuedAt,
      uid,
    })),
    E.ap(SessionId.decode(record.id)),
    E.ap(t.union([t.null, IdentityId]).decode(record.identityId)),
    E.ap(Uid.decode(record.uid))
  );

export const makeSessionService = (
  logger: Logger,
  sessionModel: SessionModel
): SessionService => ({
  find: (id) =>
    makeTEOption(logger)("find", fromRecord, () => sessionModel.findOne(id)),
  findByUid: (uid) =>
    makeTEOption(logger)("findByUid", fromRecord, () =>
      sessionModel.findOneByUid(uid)
    ),
  remove: (id) =>
    makeTE(logger)(
      "remove",
      (_) => E.right(constVoid()),
      () => sessionModel.delete(id)
    ),
  upsert: (definition) => {
    const obj = { ...toRecord(definition) };
    return makeTE(logger)("upsert", fromRecord, () => sessionModel.upsert(obj));
  },
});
