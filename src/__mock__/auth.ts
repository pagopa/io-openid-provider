import { Client } from "src/generated/clients/io-auth/client";
import { vi } from "vitest";

export const mockAuthClient = {
  getUserForFIMS: vi.fn(),
} as unknown as Client;
