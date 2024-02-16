import { InteractionService } from "src/domain/interactions/InteractionService";
import { vi } from "vitest";

export const interactionServiceMock = {
  find: vi.fn(),
  upsert: vi.fn(),
} as unknown as InteractionService;
