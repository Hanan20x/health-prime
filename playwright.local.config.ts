// Standalone Playwright config used to run e2e/login.spec.ts outside of the Lovable
// platform. The committed playwright.config.ts imports 'lovable-agent-playwright-config',
// a private package that is not available outside that platform, so this config is
// provided as a portable fallback for running the suite locally / in CI.
// Usage: npx playwright test --config=playwright.local.config.ts

import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 20000,
  use: {
    baseURL: "http://127.0.0.1:8080",
    headless: true,
  },
  reporter: [["list"], ["html", { outputFolder: "/tmp/work/playwright-report", open: "never" }]],
});
