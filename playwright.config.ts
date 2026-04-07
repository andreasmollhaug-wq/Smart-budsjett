import { defineConfig, devices } from '@playwright/test'

/** Egen port unngår kollisjon med `next dev` på 3000 lokalt. */
const e2eBase = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3005'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: e2eBase,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } }],
  webServer: {
    command: 'npx next dev --turbopack -p 3005',
    url: 'http://127.0.0.1:3005',
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
