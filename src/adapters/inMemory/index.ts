/* eslint-disable functional/prefer-readonly-type */
import { constVoid, pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/Option";
import * as TE from "fp-ts/TaskEither";
import { Identity } from "src/domain/identities/types";
import { IdentityService } from "src/domain/identities/IdentityService";
import { Client } from "../../domain/clients/types";
import { ClientService } from "../../domain/clients/ClientService";
import { DomainError } from "../../domain/types";
import { Interaction } from "../../domain/interactions/types";
import { InteractionService } from "../../domain/interactions/InteractionService";
import { Session } from "../../domain/sessions/types";
import { SessionService } from "../../domain/sessions/SessionService";
import { Grant } from "../../domain/grants/types";
import { GrantService } from "../../domain/grants/GrantService";
import { IdentityIdAndGrantId } from "../http/openidConnect/nodeOidcProvider/utils";

const upsertEntityTE =
  <K, V>(store: Map<K, V>) =>
  (idFn: (v: V) => K) =>
  (entity: V): TE.TaskEither<DomainError, V> => {
    const id = idFn(entity);
    store.delete(id);
    store.set(id, entity);
    return TE.right(entity);
  };

const findByIdTE =
  <K, V>(store: Map<K, V>) =>
  (id: K): TE.TaskEither<DomainError, O.Option<V>> => {
    const result = store.get(id);
    return TE.right(O.fromNullable(result));
  };

const findByTE =
  <K, V>(store: Map<K, V>) =>
  (fn: (v: V) => boolean): TE.TaskEither<DomainError, O.Option<V>> => {
    const result = [...store.values()].find(fn);
    return TE.right(O.fromNullable(result));
  };

const filterByTE =
  <K, V>(store: Map<K, V>) =>
  (fn: (v: V) => boolean): TE.TaskEither<DomainError, ReadonlyArray<V>> => {
    const result = [...store.values()].filter(fn);
    return TE.right(result);
  };

const removeByIdTE =
  <K, V>(store: Map<K, V>) =>
  (id: K): TE.TaskEither<DomainError, void> => {
    store.delete(id);
    return TE.right(constVoid());
  };

// Define makes

export const makeClientService = (
  snapshot: ReadonlyArray<Client> = []
): ClientService => {
  const store = new Map(
    snapshot.map((client) => [client.clientId.serviceId, client])
  );
  return {
    find: (id) => findByIdTE(store)(id.serviceId),
    list: (selector) =>
      filterByTE(store)(
        (client) =>
          O.fold(
            () => true,
            (org) => client.clientId.organizationId === org
          )(selector.organizationId) &&
          O.fold(
            () => true,
            (sId) => client.clientId.serviceId === sId
          )(selector.serviceId)
      ),
    remove: (id) => removeByIdTE(store)(id.serviceId),
    upsert: upsertEntityTE(store)((_) => _.clientId.serviceId),
  };
};

export const makeInteractionService = (
  snapshot: ReadonlyArray<Interaction> = []
): InteractionService => {
  const store = new Map(
    snapshot.map((interaction) => [interaction.id, interaction])
  );
  return {
    find: findByIdTE(store),
    remove: removeByIdTE(store),
    upsert: upsertEntityTE(store)((_) => _.id),
  };
};

export const makeGrantService = (
  snapshot: ReadonlyArray<Grant> = []
): GrantService => {
  const encodeId = IdentityIdAndGrantId.encode;
  const store = new Map(
    snapshot.map((grant) => [
      encodeId([grant.subjects.identityId, grant.id]),
      grant,
    ])
  );
  return {
    find: (idn, grn) => findByIdTE(store)(encodeId([idn, grn])),
    findBy: (selector) =>
      filterByTE(store)(
        (grant) =>
          pipe(
            selector.clientId,
            O.fold(
              () => false,
              (_) => _.serviceId === grant.subjects.clientId.serviceId
            )
          ) &&
          selector.identityId === grant.subjects.identityId &&
          grant.remember === selector.remember
      ),
    remove: (idn, grn) => removeByIdTE(store)(encodeId([idn, grn])),
    upsert: upsertEntityTE(store)((_) =>
      encodeId([_.subjects.identityId, _.id])
    ),
  };
};

export const makeSessionService = (
  snapshot: ReadonlyArray<Session> = []
): SessionService => {
  const store = new Map(snapshot.map((session) => [session.id, session]));
  return {
    find: findByIdTE(store),
    findByUid: (uid) => findByTE(store)((s) => s.uid === uid),
    remove: removeByIdTE(store),
    upsert: upsertEntityTE(store)((_) => _.id),
  };
};

export const makeIdentityService = (identity: Identity): IdentityService => ({
  authenticate: (_accessToken) => TE.right(identity),
});
