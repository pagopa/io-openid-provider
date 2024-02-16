import { InteractionService } from "src/domain/interactions/InteractionService";
import { vi } from "vitest";
import { mockAuthClient } from "./auth";

export const identityServiceMock = {
  authenticate: vi.fn((token) => () => mockAuthClient.getUserForFIMS(token)),
} as unknown as InteractionService;
