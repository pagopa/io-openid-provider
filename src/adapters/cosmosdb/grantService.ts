import * as t from "io-ts";
import { constVoid, pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import { Grant, GrantId } from "../../domain/grants/types";
import { GrantService } from "../../domain/grants/GrantService";
import { Logger } from "../../domain/logger";
import { IdentityId } from "../../domain/identities/types";
import { ClientId } from "../../domain/clients/types";
import { getTTL, makeTE, makeTEOption } from "./utils";
import { CosmosGrant, GrantModel, RetrievedGrant } from "./model/grant";

export const toRecord = (entity: Grant): CosmosGrant => ({
  clientId: Grant.props.subjects.props.clientId.encode(
    entity.subjects.clientId
  ),
  expireAt: entity.expireAt,
  id: entity.id,
  identityId: entity.subjects.identityId,
  issuedAt: entity.issuedAt,
  remember: entity.remember || false,
  scope: entity.scope,
  ttl: getTTL(entity.expireAt, entity.issuedAt),
});

export const fromRecord = (record: RetrievedGrant): t.Validation<Grant> =>
  pipe(
    E.of(
      (grantId: GrantId) => (identityId: IdentityId) => (clientId: ClientId) => ({
        expireAt: record.expireAt,
        id: grantId,
        issuedAt: record.issuedAt,
        remember: record.remember,
        scope: record.scope,
        subjects: {
          clientId,
          identityId,
        },
      })
    ),
    E.ap(GrantId.decode(record.id)),
    E.ap(IdentityId.decode(record.identityId)),
    E.ap(Grant.props.subjects.props.clientId.decode(record.clientId))
  );

export const makeGrantService = (
  logger: Logger,
  grantModel: GrantModel
): GrantService => ({
  find: (identityId, grantId) =>
    makeTEOption(logger)("find", fromRecord, () =>
      grantModel.findOne(grantId, identityId)
    ),
  findBy: (selector) => {
    const clientId = pipe(
      selector.clientId,
      O.map(Grant.props.subjects.props.clientId.encode),
      O.toUndefined
    );
    return makeTE(logger)("findBy", E.traverseArray(fromRecord), () =>
      grantModel.findAllByQuery(
        selector.identityId,
        selector.remember,
        clientId
      )
    );
  },
  remove: (identityId, grantId) =>
    makeTE(logger)(
      "remove",
      (_) => E.right(constVoid()),
      () => grantModel.delete(grantId, identityId)
    ),
  upsert: (definition) => {
    const obj = { ...toRecord(definition) };
    return makeTE(logger)("upsert", fromRecord, () => grantModel.upsert(obj));
  },
});
