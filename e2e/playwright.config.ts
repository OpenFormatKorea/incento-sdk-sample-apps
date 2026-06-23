import { defineConfig, devices } from '@playwright/test';

/**
 * 멀티 플랫폼 E2E 설정.
 * - project마다 testDir/baseURL을 분리해 호스트 앱별 spec을 격리한다.
 *   - web-spa: Vite + react-router (소프트 네비게이션), :5173, specs/spa
 *   - web-mpa: Next.js (하드 네비게이션),            :3000, specs/mpa
 * - webServer 배열로 두 dev 서버를 함께 기동/종료한다.
 * - fixtures(incento-mock)와 위젯 POM(widget.pom)은 두 project가 공유한다.
 */
const WEB_SPA_PORT = 5173;
const WEB_MPA_PORT = 3000;

export default defineConfig({
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    trace: 'on-first-retry',
    actionTimeout: 10_000,
  },
  projects: [
    {
      name: 'web-spa',
      testDir: './specs/spa',
      use: { ...devices['Desktop Chrome'], baseURL: `http://localhost:${WEB_SPA_PORT}` },
    },
    {
      name: 'web-mpa',
      testDir: './specs/mpa',
      use: { ...devices['Desktop Chrome'], baseURL: `http://localhost:${WEB_MPA_PORT}` },
    },
  ],
  webServer: [
    {
      command: 'npm run dev --prefix ../web-spa',
      url: `http://localhost:${WEB_SPA_PORT}`,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      command: 'npm run dev --prefix ../web-mpa',
      url: `http://localhost:${WEB_MPA_PORT}`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
