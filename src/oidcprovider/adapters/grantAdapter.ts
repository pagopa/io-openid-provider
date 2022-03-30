import * as oidc from "oidc-provider";
import * as t from "io-ts";
import { constVoid, pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { GrantRepository } from "../../core/repositories/GrantRepository";
import { Grant, GrantId, makeDomainError } from "../../core/domain";
import { Logger } from "../../logger";
import { makeNotImplementedAdapter, taskEitherToPromise } from "./utils";

export const GrantPayload = t.type({
  accountId: t.string,
  clientId: t.string,
  exp: t.number,
  iat: t.number,
  jti: t.string,
  openid: t.type({
    scope: t.string,
  }),
});

export const toAdapterPayload = (input: Grant): oidc.AdapterPayload => ({
  accountId: input.accountId,
  clientId: input.clientId,
  exp: input.expireAt,
  iat: input.issuedAt,
  jit: input.id,
  openid: { scope: input.scope },
});

export const fromPayloadAdapter = (
  input: oidc.AdapterPayload
): t.Validation<Grant> =>
  pipe(
    GrantPayload.decode(input),
    E.chain((grantPayload) =>
      Grant.decode({
        ...grantPayload,
        expireAt: grantPayload.exp,
        id: grantPayload.jti,
        issuedAt: grantPayload.iat,
        scope: grantPayload.openid.scope,
      })
    )
  );

export const makeGrantAdapter = (
  logger: Logger,
  grantRepository: GrantRepository
) => ({
  ...makeNotImplementedAdapter("Grant", logger),
  // given the identifier return a grant
  find: (id: string) => {
    logger.debug(`Grant find, id: ${id}`);
    const result = pipe(
      pipe(GrantId.decode(id), E.mapLeft(makeDomainError), TE.fromEither),
      TE.chain(grantRepository.find),
      TE.map(O.map(toAdapterPayload)),
      TE.map(O.toUndefined)
    );
    return taskEitherToPromise(result);
  },
  // insert or update the grant identified with the given id
  upsert: (id: string, payload: oidc.AdapterPayload, expiresIn: number) => {
    logger.debug(
      `Grant upsert, id: ${id}, _expiresIn: ${expiresIn}, payload: ${JSON.stringify(
        payload
      )}`
    );
    const result = pipe(
      TE.fromEither(fromPayloadAdapter(payload)),
      TE.mapLeft(makeDomainError),
      TE.orElseFirst((e) =>
        TE.of(
          logger.error("Some error during the upsert operation: ", e.causedBy)
        )
      ),
      TE.chain(grantRepository.upsert),
      TE.map(constVoid)
    );
    return taskEitherToPromise(result);
  },
});
