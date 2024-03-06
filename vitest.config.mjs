import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["dotenv/config"],
    environment: "node",
    onConsoleLog: () => false,
  },
});
