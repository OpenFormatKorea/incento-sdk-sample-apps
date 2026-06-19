import { defineConfig, devices } from '@playwright/test';

/**
 * web-spa E2E 설정.
 * - webServer: web-spa dev 서버를 자동 기동/종료 (포트 5173).
 * - baseURL로 spec에서 상대 경로 사용.
 */
const WEB_SPA_PORT = 5173;

export default defineConfig({
  testDir: './specs',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${WEB_SPA_PORT}`,
    trace: 'on-first-retry',
    actionTimeout: 10_000,
  },
  projects: [
    {
      name: 'web-spa',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev --prefix ../web-spa',
    url: `http://localhost:${WEB_SPA_PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
