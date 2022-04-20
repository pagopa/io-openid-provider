import { constVoid, pipe } from "fp-ts/lib/function";
import * as t from "io-ts";
import * as prisma from "@prisma/client";
import { PrismaClient } from "@prisma/client";
import * as E from "fp-ts/Either";
import { Logger } from "../../domain/logger";
import { SessionService } from "../../domain/sessions/SessionService";
import { Session, SessionId, Uid } from "../../domain/sessions/types";
import { IdentityId } from "../../domain/identities/types";
import { MongoDBConfig } from "./types";
import { runAsTE, runAsTEO } from "./utils";

const toRecord = (entity: Session): prisma.Session => ({
  ...entity,
  identityId: entity.identityId || null,
});

const fromRecord = (record: prisma.Session): t.Validation<Session> =>
  pipe(
    E.of((id: SessionId) => (identityId: null | IdentityId) => (uid: Uid) => ({
      ...record,
      id,
      identityId: identityId || undefined,
      uid,
    })),
    E.ap(SessionId.decode(record.id)),
    E.ap(t.union([t.null, IdentityId]).decode(record.identityId)),
    E.ap(Uid.decode(record.uid))
  );

export const makeSessionService = (
  config: MongoDBConfig,
  logger: Logger,
  client: PrismaClient = new PrismaClient({
    datasources: { db: { url: config.connectionString.href } },
  })
): SessionService => ({
  find: (id) =>
    runAsTEO(logger)("find", fromRecord, () =>
      client.session.findUnique({ where: { id } })
    ),
  findByUid: (uid) =>
    runAsTEO(logger)("findByUid", fromRecord, () =>
      client.session.findUnique({ where: { uid } })
    ),
  remove: (id) =>
    runAsTE(logger)(
      "remove",
      (_) => E.right(constVoid()),
      () => client.session.delete({ where: { id } })
    ),
  upsert: (definition) => {
    const obj = { ...toRecord(definition) };
    return runAsTE(logger)("upsert", fromRecord, () =>
      client.session.upsert({
        create: obj,
        update: { ...{ ...obj, id: undefined } },
        where: { id: definition.id },
      })
    );
  },
});
