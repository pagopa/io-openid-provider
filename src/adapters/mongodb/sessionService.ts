import { constVoid, pipe } from "fp-ts/lib/function";
import * as t from "io-ts";
import * as prisma from "@prisma/client";
import { Prisma } from "@prisma/client";
import * as E from "fp-ts/Either";
import { Logger } from "../../domain/logger";
import { SessionService } from "../../domain/sessions/SessionService";
import { Session, SessionId, Uid } from "../../domain/sessions/types";
import { IdentityId } from "../../domain/identities/types";
import { runAsTE, runAsTEO } from "./utils";

const toRecord = (entity: Session): prisma.Session => ({
  expireAt: entity.expireAt,
  id: entity.id,
  identityId: entity.identityId || null,
  issuedAt: entity.issuedAt,
  uid: entity.uid,
});

const fromRecord = (record: prisma.Session): t.Validation<Session> =>
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

export const makeSessionService = <T>(
  logger: Logger,
  client: Prisma.SessionDelegate<T>
): SessionService => ({
  find: (id) =>
    runAsTEO(logger)("find", fromRecord, () =>
      client.findUnique({ where: { id } })
    ),
  findByUid: (uid) =>
    runAsTEO(logger)("findByUid", fromRecord, () =>
      client.findUnique({ where: { uid } })
    ),
  remove: (id) =>
    runAsTE(logger)(
      "remove",
      (_) => E.right(constVoid()),
      () => client.delete({ where: { id } })
    ),
  upsert: (definition) => {
    const obj = { ...toRecord(definition) };
    return runAsTE(logger)("upsert", fromRecord, () =>
      client.upsert({
        create: obj,
        update: { ...{ ...obj, id: undefined } },
        where: { id: definition.id },
      })
    );
  },
});
