import * as oidc from "oidc-provider";
import * as t from "io-ts";
import { constVoid, pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { GrantRepository } from "../../core/repositories/GrantRepository";
import {
  AccountId,
  ClientId,
  Grant,
  GrantId,
  makeDomainError,
} from "../../core/domain";
import { Logger } from "../../logger";
import {
  DateFromNumericDate,
  makeNotImplementedAdapter,
  taskEitherToPromise,
} from "./utils";

export const GrantPayload = t.type({
  accountId: t.string,
  clientId: t.string,
  exp: DateFromNumericDate,
  iat: DateFromNumericDate,
  jti: t.string,
  openid: t.type({
    scope: t.string,
  }),
});
type GrantPayload = t.TypeOf<typeof GrantPayload>;

export const toAdapterPayload = (input: Grant): oidc.AdapterPayload =>
  GrantPayload.encode({
    accountId: input.accountId,
    clientId: input.clientId,
    exp: input.expireAt,
    iat: input.issuedAt,
    jti: input.id,
    openid: { scope: input.scope },
  });

export const fromAdapterPayload = (
  input: oidc.AdapterPayload
): t.Validation<Grant> => {
  const makeGrant =
    (id: GrantId) =>
    (accountId: AccountId) =>
    (clientId: ClientId) =>
    (payload: GrantPayload): Grant => ({
      accountId,
      clientId,
      expireAt: payload.exp,
      id,
      issuedAt: payload.iat,
      remember: false,
      scope: payload.openid.scope,
    });
  return pipe(
    GrantPayload.decode(input),
    E.chain((grantPayload) =>
      pipe(
        E.of(makeGrant),
        E.ap(GrantId.decode(grantPayload.jti)),
        E.ap(AccountId.decode(grantPayload.accountId)),
        E.ap(ClientId.decode(grantPayload.clientId)),
        E.ap(E.of(grantPayload))
      )
    )
  );
};

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
      TE.fromEither(fromAdapterPayload(payload)),
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
