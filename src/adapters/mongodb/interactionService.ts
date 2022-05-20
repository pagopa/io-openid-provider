import * as t from "io-ts";
import { pipe, constVoid } from "fp-ts/function";
import * as E from "fp-ts/Either";
import * as prisma from "@prisma/client";
import { Prisma } from "@prisma/client";
import { Interaction, makeResult } from "../../domain/interactions/types";
import { InteractionService } from "../../domain/interactions/InteractionService";
import { Logger } from "../../domain/logger";
import { GrantId } from "../../domain/grants/types";
import { IdentityId } from "../../domain/identities/types";
import { runAsTE, runAsTEO } from "./utils";

export const toRecord = (
  entity: Interaction
): prisma.Prisma.InteractionCreateInput => ({
  error: entity.result && "error" in entity.result ? entity.result.error : null,
  expireAt: entity.expireAt,
  grantId:
    entity.result && "grantId" in entity.result ? entity.result.grantId : null,
  id: entity.id,
  identityId:
    entity.result && "identityId" in entity.result
      ? entity.result.identityId
      : null,
  issuedAt: entity.issuedAt,
  params: Interaction.props.params.encode(entity.params),
  payload: entity.payload,
});

export const fromRecord = (
  record: prisma.Interaction
): t.Validation<Interaction> =>
  pipe(
    E.of(
      (id: Interaction["id"]) =>
        (grantId: GrantId | null) =>
        (identityId: IdentityId | null) =>
        (error: string | null) =>
        (params: Interaction["params"]) =>
        (payload: Interaction["payload"]) => ({
          expireAt: record.expireAt,
          id,
          issuedAt: record.issuedAt,
          params,
          payload,
          result: makeResult(grantId || undefined)(identityId || undefined)(
            error || undefined
          ),
        })
    ),
    E.ap(Interaction.props.id.decode(record.id)),
    E.ap(t.union([t.null, GrantId]).decode(record.grantId)),
    E.ap(t.union([t.null, IdentityId]).decode(record.identityId)),
    E.ap(t.union([t.null, t.string]).decode(record.error)),
    E.ap(Interaction.props.params.decode(record.params)),
    E.ap(Interaction.props.payload.decode(record.payload))
  );

export const makeInteractionService = <T>(
  logger: Logger,
  client: Prisma.InteractionDelegate<T>
): InteractionService => ({
  find: (id) =>
    runAsTEO(logger)("find", fromRecord, () =>
      client.findUnique({ where: { id } })
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
