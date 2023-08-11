import * as t from "io-ts";
import { pipe, constVoid } from "fp-ts/function";
import * as E from "fp-ts/Either";
import { Interaction, makeResult } from "../../domain/interactions/types";
import { InteractionService } from "../../domain/interactions/InteractionService";
import { Logger } from "../../domain/logger";
import { GrantId } from "../../domain/grants/types";
import { IdentityId } from "../../domain/identities/types";
import { makeTE, makeTEOption } from "./utils";
import {
  CosmosInteraction,
  InteractionModel,
  RetrievedInteraction,
} from "./model/interaction";

export const toRecord = (entity: Interaction): CosmosInteraction => ({
  error:
    entity.result && "error" in entity.result ? entity.result.error : undefined,
  expireAt: entity.expireAt,
  grantId:
    entity.result && "grantId" in entity.result
      ? entity.result.grantId
      : undefined,
  id: entity.id,
  identityId:
    entity.result && "identityId" in entity.result
      ? entity.result.identityId
      : undefined,
  issuedAt: entity.issuedAt,
  params: entity.params,
  payload: entity.payload,
});

export const fromRecord = (
  record: RetrievedInteraction
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

export const makeInteractionService = (
  logger: Logger,
  interactionModel: InteractionModel
): InteractionService => ({
  find: (id) =>
    makeTEOption(logger)("find", fromRecord, () =>
      interactionModel.findOne(id)
    ),
  remove: (id) =>
    makeTE(logger)(
      "remove",
      (_) => E.right(constVoid()),
      () => interactionModel.delete(id)
    ),
  upsert: (definition) => {
    const obj = { ...toRecord(definition) };
    return makeTE(logger)("upsert", fromRecord, () =>
      interactionModel.upsert(obj)
    );
  },
});
