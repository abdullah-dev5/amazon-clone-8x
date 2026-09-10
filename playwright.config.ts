import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: false,
  // Tests share one real Postgres database (no per-test isolated
  // database), so forcing a single worker keeps them deterministic rather
  // than trying to make every test file independently parallel-safe
  // against shared data.
  workers: 1,
  retries: 0,
  // In CI, also write an HTML report so a failure has something for the
  // workflow to upload as a debuggable artifact — `open: "never"` keeps
  // it from trying to launch a browser tab in a headless runner. Local
  // runs stay on the plain list reporter.
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    // In CI, the workflow already runs `npm run build` as its own check —
    // reuse that build (fast `next start`) instead of rebuilding via dev
    // mode, and never reuse a stray already-listening server there. Local
    // runs keep the fast dev-mode default.
    command: process.env.CI ? "npm run start" : "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
