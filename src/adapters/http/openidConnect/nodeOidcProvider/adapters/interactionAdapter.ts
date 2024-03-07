import * as t from "io-ts";
import { pipe } from "fp-ts/lib/function.js";
import * as E from "fp-ts/lib/Either.js";
import * as oidc from "oidc-provider";
import { Logger } from "../../../../../domain/logger/index.js";
import { InteractionService } from "../../../../../domain/interactions/InteractionService.js";
import { GrantId } from "../../../../../domain/grants/types.js";
import { IdentityId } from "../../../../../domain/identities/types.js";
import {
  InteractionId,
  Interaction,
  makeResult,
} from "../../../../../domain/interactions/types.js";
import {
  DateFromNumericDate,
  destroyFromTE,
  findFromTEO,
  makeNotImplementedAdapter,
  upsertFromTE,
} from "../utils.js";

const interactionToAdapterPayload = (
  item: Interaction
): oidc.AdapterPayload => ({
  ...item.payload,
  exp: DateFromNumericDate.encode(item.expireAt),
  iat: DateFromNumericDate.encode(item.issuedAt),
  jti: item.id,
});

export const adapterPayloadToInteraction = (
  payload: oidc.AdapterPayload
): t.Validation<Interaction> =>
  pipe(
    E.of(
      (id: Interaction["id"]) =>
        (grantId: GrantId | undefined) =>
        (identityId: IdentityId | undefined) =>
        (error: string | undefined) =>
        (params: Interaction["params"]) =>
        (fullPayload: Interaction["payload"]) =>
        (exp: Date) =>
        (iat: Date) => ({
          expireAt: exp,
          id,
          issuedAt: iat,
          params,
          payload: { ...fullPayload },
          result: makeResult(grantId)(identityId)(error),
        })
    ),
    E.ap(Interaction.props.id.decode(payload.jti)),
    E.ap(
      t.union([t.undefined, GrantId]).decode(payload.result?.consent?.grantId)
    ),
    E.ap(
      t
        .union([t.undefined, IdentityId])
        .decode(payload.result?.login?.accountId || payload.session?.accountId)
    ),
    E.ap(t.union([t.undefined, t.string]).decode(payload.result?.error)),
    E.ap(Interaction.props.params.decode(payload.params)),
    E.ap(Interaction.props.payload.decode(payload)),
    E.ap(DateFromNumericDate.decode(payload.exp)),
    E.ap(DateFromNumericDate.decode(payload.iat))
  );

export const makeInteractionAdapter = (
  logger: Logger,
  interactionService: InteractionService
): oidc.Adapter => ({
  ...makeNotImplementedAdapter("Interaction", logger),
  destroy: destroyFromTE(
    logger,
    "Interaction",
    InteractionId.decode,
    interactionService.remove
  ),
  find: findFromTEO(
    logger,
    "Interaction",
    InteractionId.decode,
    interactionToAdapterPayload,
    interactionService.find
  ),
  upsert: upsertFromTE(
    logger,
    "Interaction",
    adapterPayloadToInteraction,
    interactionService.upsert
  ),
});
