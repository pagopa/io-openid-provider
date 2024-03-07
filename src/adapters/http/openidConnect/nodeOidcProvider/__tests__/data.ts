import * as inMemory from "../../../../inMemory";
import { makeLogger } from "../../../../winston";
import { makeConfiguration } from "../index";
import { config } from "../../../../../__tests__/data";
import { identity } from "../../../../../domain/identities/__tests__/data";
import { AuthenticateUseCase } from "../../../../../useCases/AuthenticateUseCase.js";

export const configuration = makeConfiguration(
  config,
  makeLogger(config.logger),
  AuthenticateUseCase(
    makeLogger(config.logger),
    inMemory.makeIdentityService(identity)
  ),
  inMemory.makeClientService(),
  inMemory.makeInteractionService(),
  inMemory.makeSessionService(),
  inMemory.makeGrantService()
);
