/* eslint-disable functional/prefer-readonly-type */
import { constVoid } from "fp-ts/lib/function";
import * as O from "fp-ts/Option";
import * as TE from "fp-ts/TaskEither";
import { IdentityId } from "src/domain/identities/types";
import { IdentityService } from "src/domain/identities/IdentityService";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { Client } from "../../domain/clients/types";
import { ClientService } from "../../domain/clients/ClientService";
import { DomainError } from "../../domain/types";
import { Interaction } from "../../domain/interactions/types";
import { InteractionService } from "../../domain/interactions/InteractionService";
import { Session } from "../../domain/sessions/types";
import { SessionService } from "../../domain/sessions/SessionService";
import { Grant } from "../../domain/grants/types";
import { GrantService } from "../../domain/grants/GrantService";

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
  const store = new Map(snapshot.map((client) => [client.clientId, client]));
  return {
    find: findByIdTE(store),
    list: (selector) =>
      filterByTE(store)(
        (client) =>
          client.organizationId === selector.organizationId &&
          client.serviceId === selector.serviceId
      ),
    remove: removeByIdTE(store),
    upsert: upsertEntityTE(store)((_) => _.clientId),
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
  const store = new Map(snapshot.map((grant) => [grant.id, grant]));
  return {
    find: findByIdTE(store),
    findBySubjects: (sbjs) =>
      findByTE(store)(
        (grant) =>
          sbjs.clientId === grant.subjects.clientId &&
          sbjs.identityId === grant.subjects.identityId &&
          grant.remember === true
      ),
    remove: removeByIdTE(store),
    upsert: upsertEntityTE(store)((_) => _.id),
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

export const makeIdentityService = (): IdentityService => ({
  authenticate: (_accessToken) =>
    TE.right({
      familyName: "familyName",
      fiscalCode: "123" as NonEmptyString,
      givenName: "givenName",
      id: "identity-id" as IdentityId,
    }),
});
