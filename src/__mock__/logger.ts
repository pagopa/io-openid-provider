import { vi } from "vitest";
import { Logger } from "winston";

export const loggerMock = {
  debug: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
} as unknown as Logger;
