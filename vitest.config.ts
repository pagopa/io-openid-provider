import { defineConfig } from "vitest/config";
import "dotenv/config";

process.env;

export default defineConfig({
  test: {
    clearMocks: true,
    globals: true,
  },
});
