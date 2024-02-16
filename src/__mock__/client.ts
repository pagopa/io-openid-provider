import { ClientService } from "src/domain/clients/ClientService";
import { vi } from "vitest";

export const clientServiceMock = {
  find: vi.fn(),
  list: vi.fn(),
} as unknown as ClientService;
