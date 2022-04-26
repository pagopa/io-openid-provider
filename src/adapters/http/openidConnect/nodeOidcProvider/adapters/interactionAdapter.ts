import * as t from "io-ts";
import { pipe } from "fp-ts/function";
import * as E from "fp-ts/Either";
import * as oidc from "oidc-provider";
import { Logger } from "../../../../../domain/logger";
import { InteractionService } from "../../../../../domain/interactions/InteractionService";
import {
  InteractionId,
  Interaction,
} from "../../../../../domain/interactions/types";
import {
  DateFromNumericDate,
  destroyFromTE,
  findFromTEO,
  makeNotImplementedAdapter,
  upsertFromTE,
} from "../utils";

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
      (exp: Date) => (iat: Date) =>
        Interaction.decode({
          expireAt: exp,
          id: payload.jti,
          identity: undefined,
          issuedAt: iat,
          params: payload.params,
          payload,
          result:
            payload.result?.consent ||
            payload.result?.login ||
            payload.session?.accountId
              ? {
                  grantId: payload.result?.consent?.grantId,
                  identity:
                    payload.result?.login?.accountId ||
                    payload.session?.accountId,
                }
              : undefined,
          returnTo: payload.returnTo,
          session: payload.session
            ? {
                cookieId: payload.session.cookie,
                identityId: payload.session.accountId,
                // uid: payload.session.uid,
              }
            : undefined,
        })
    ),
    E.ap(DateFromNumericDate.decode(payload.exp)),
    E.ap(DateFromNumericDate.decode(payload.iat)),
    E.flatten
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
