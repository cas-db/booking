import { defineConfig, devices } from '@playwright/test'

const UI = 'http://localhost:5173'
const SERVICE = 'http://localhost:4004'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: UI,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'npm start',
      url: `${SERVICE}/booking/Customers`,
      reuseExistingServer: !process.env.CI,
      stdout: 'ignore',
      timeout: 60_000,
    },
    {
      command: 'npm run ui',
      url: UI,
      reuseExistingServer: !process.env.CI,
      stdout: 'ignore',
      timeout: 60_000,
    },
  ],
})
