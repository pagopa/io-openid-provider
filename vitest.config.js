import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    onConsoleLog: () => false,
    coverage: {
      include: ["src"],
    },
  },
});
