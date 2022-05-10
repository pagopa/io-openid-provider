import { makeApplication } from "../index";
import { client } from "../../../domain/clients/__tests__/data";
import { identity } from "../../../domain/identities/__tests__/data";
import { config } from "../../../__tests__/data";
import * as inMemory from "../../inMemory";
import { makeLogger } from "../../winston";

/**
 * Create and return a fake application and in memory services required by the system.
 */
export const makeInMemoryApplication = () => {
  const logger = makeLogger(config.logger);
  const clientService = inMemory.makeClientService([client]);
  const interactionService = inMemory.makeInteractionService();
  const sessionService = inMemory.makeSessionService();
  const grantService = inMemory.makeGrantService();
  const identityService = inMemory.makeIdentityService(identity);
  const app = makeApplication({
    config,
    logger,
    clientService,
    interactionService,
    identityService,
    sessionService,
    grantService,
  });
  return { client, app };
};
