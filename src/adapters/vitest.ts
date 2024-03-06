import { vi } from "vitest";
import * as TE from "fp-ts/lib/TaskEither";

import { InteractionService } from "../domain/interactions/InteractionService";
import { IdentityService } from "../domain/identities/IdentityService";
import { ClientService } from "../domain/clients/ClientService";
import { GrantService } from "../domain/grants/GrantService";

import { DomainErrorTypes, makeDomainError } from "../domain/types";

const notImplemented = makeDomainError(
  "not implemented",
  DomainErrorTypes.NOT_IMPLEMENTED
);

const notImplementedTE = TE.left(notImplemented);

export const interactionService: InteractionService = {
  find: vi.fn(() => notImplementedTE),
  remove: vi.fn(() => notImplementedTE),
  upsert: vi.fn(() => notImplementedTE),
};

export const identityService: IdentityService = {
  authenticate: vi.fn(() => notImplementedTE),
};

export const clientService: ClientService = {
  find: vi.fn(() => notImplementedTE),
  remove: vi.fn(() => notImplementedTE),
  upsert: vi.fn(() => notImplementedTE),
  list: vi.fn(() => notImplementedTE),
};

export const grantService: GrantService = {
  find: vi.fn(() => notImplementedTE),
  remove: vi.fn(() => notImplementedTE),
  upsert: vi.fn(() => notImplementedTE),
  findBy: vi.fn(() => notImplementedTE),
};
