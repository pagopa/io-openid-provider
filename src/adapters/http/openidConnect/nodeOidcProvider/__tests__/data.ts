import * as inMemory from "../../../../inMemory";
import { makeLogger } from "../../../../winston";
import { makeConfiguration } from "../index";
import { config } from "../../../../../__tests__/data";

export const configuration = makeConfiguration(
  makeLogger(config.logger),
  inMemory.makeClientService(),
  inMemory.makeInteractionService(),
  inMemory.makeSessionService(),
  inMemory.makeGrantService()
);
