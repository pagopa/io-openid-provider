import { GrantService } from "src/domain/grants/GrantService";
import { vi } from "vitest";

export const grantServiceMock = {
  findBy: vi.fn(),
  find: vi.fn(),
  upsert: vi.fn(),
  remove: vi.fn(),
} as unknown as GrantService;
