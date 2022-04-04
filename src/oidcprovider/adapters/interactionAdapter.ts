import * as oidc from "oidc-provider";
import * as t from "io-ts";
import { pipe, constVoid } from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { Logger } from "../../logger";
import {
  ClientId,
  Interaction,
  InteractionId,
  makeDomainError,
} from "../../core/domain";
import { InteractionRepository } from "../../core/repositories/InteractionRepository";
import { makeNotImplementedAdapter, taskEitherToPromise } from "./utils";

export const InteractionPayload = t.type({
  exp: t.number,
  iat: t.number,
  jti: t.string,
  kind: t.literal("Interaction"),
  // lastSubmission exists only if consent
  lastSubmission: t.union([
    t.undefined,
    t.type({
      login: t.type({
        accountId: t.string,
      }),
    }),
  ]),
  params: t.type({
    client_id: t.string,
    nonce: t.string,
    redirect_uri: t.string,
    response_type: t.string,
    scope: t.string,
    state: t.string,
  }),
  prompt: t.type({
    details: t.union([
      t.UnknownRecord,
      t.intersection([
        t.UnknownRecord,
        // missingOIDCScope exists only if consent
        t.type({ missingOIDCScope: t.array(t.string) }),
      ]),
    ]),
    name: t.union([t.literal("login"), t.literal("consent")]),
    reasons: t.array(t.string),
  }),
  // The field result is set during the interaction
  result: t.union([
    t.undefined,
    t.type({
      error: t.string,
    }),
    t.type({
      login: t.type({
        accountId: t.string,
      }),
    }),
    // consent exists only if consent
    t.type({
      consent: t.type({
        grantId: t.string,
      }),
    }),
  ]),
  returnTo: t.string,
  // session exists only if consent
  session: t.union([
    t.undefined,
    t.type({
      accountId: t.string,
      cookie: t.string,
      uid: t.string,
    }),
  ]),
});
type InteractionPayload = t.TypeOf<typeof InteractionPayload>;

// FIXME: Improve this mapping
export const toAdapterPayload = (item: Interaction): InteractionPayload => ({
  exp: item.expireAt,
  iat: item.issuedAt,
  jti: item.id,
  kind: "Interaction",
  lastSubmission: item.session
    ? { login: { accountId: item.session.accountId } }
    : undefined,
  params: {
    client_id: item.params.client_id,
    nonce: item.params.nonce,
    redirect_uri: item.params.redirect_uri,
    response_type: item.params.response_type,
    scope: item.params.scope,
    state: item.params.state,
  },
  prompt: {
    ...item.prompt,
    name: item.session ? "consent" : "login",
  },
  result: item.result,
  returnTo: item.returnTo,
  session: item.session
    ? {
        accountId: item.session.accountId,
        cookie: item.session.cookieId,
        uid: item.session.uid,
      }
    : undefined,
});

// FIXME: Improve this mapping
export const fromAdapterPayload = (
  input: oidc.AdapterPayload
): t.Validation<Interaction> =>
  pipe(
    InteractionPayload.decode(input),
    E.chain((payload) =>
      Interaction.decode({
        ...payload,
        clientId: payload.params.client_id as ClientId,
        expireAt: payload.exp,
        id: payload.jti as InteractionId,
        issuedAt: payload.iat,
        prompt: payload.prompt,
        result: payload.result,
        session: payload.session
          ? {
              accountId: payload.session.accountId,
              cookieId: payload.session.cookie,
              uid: payload.session.uid,
            }
          : undefined,
      } as Interaction)
    )
  );

export const makeInteractionAdapter = (
  logger: Logger,
  interactionRepository: InteractionRepository
) => ({
  ...makeNotImplementedAdapter("Interaction", logger),
  // remove an Interaction
  destroy: (id: string) => {
    logger.debug(`Interaction destroy, id: ${id}`);
    const result = pipe(
      pipe(InteractionId.decode(id), E.mapLeft(makeDomainError), TE.fromEither),
      TE.chain(interactionRepository.remove)
    );
    return taskEitherToPromise(result);
  },
  // given the identifier return a LoginRequest
  find: (id: string) => {
    logger.debug(`Interaction find, id: ${id}`);
    const result = pipe(
      pipe(InteractionId.decode(id), E.mapLeft(makeDomainError), TE.fromEither),
      TE.chain(interactionRepository.find),
      TE.map(O.map(toAdapterPayload)),
      TE.map(O.toUndefined)
    );
    return taskEitherToPromise(result);
  },
  // insert or update the grant identified with the given id
  upsert: (id: string, payload: oidc.AdapterPayload, expiresIn: number) => {
    logger.debug(
      `Interaction upsert, id: ${id}, _expiresIn: ${expiresIn}, payload: ${JSON.stringify(
        payload,
        null,
        2
      )}`
    );
    const result = pipe(
      TE.fromEither(fromAdapterPayload(payload)),
      TE.mapLeft(makeDomainError),
      TE.orElseFirst((e) =>
        TE.of(
          logger.error(
            "Some error during the upsert operation of Interaction: ",
            e.causedBy
          )
        )
      ),
      TE.chain(interactionRepository.upsert),
      TE.map(constVoid)
    );
    return taskEitherToPromise(result);
  },
});
