import { type Page, expect } from '@playwright/test';

/**
 * web-spa 앱(호스트) 네비게이션/인증 Page Object.
 */
export class AppPom {
  constructor(private readonly page: Page) {}

  async gotoHome(): Promise<void> {
    await this.page.goto('/');
  }

  /** 상단 Nav 링크로 SPA 이동(새로고침 아님 — 인메모리 로그인 유지). */
  async navTo(label: '홈' | '상품 목록' | '마이페이지'): Promise<void> {
    await this.page.getByRole('link', { name: label }).click();
  }

  /** /login 폼으로 직접 로그인 → 홈('/')으로 이동. */
  async login(username = 'member_001', password = 'pw1234'): Promise<void> {
    await this.page.goto('/login');
    // 초기 boot(위젯 마운트) 완료 후 로그인해야 shutdown/boot 중복 마운트 레이스를 피함.
    await this.page.locator('#incento-launcher').first().waitFor({ state: 'attached', timeout: 20_000 });
    await this.page.getByPlaceholder('아이디').fill(username);
    await this.page.getByPlaceholder('비밀번호').fill(password);
    await this.page.getByRole('button', { name: '로그인' }).click();
    await expect(this.page).toHaveURL(/\/($|\?)/);
  }

  /** 마이페이지에서 로그아웃 → /login. */
  async logout(): Promise<void> {
    await this.page.getByRole('button', { name: '로그아웃' }).click();
    await expect(this.page).toHaveURL(/\/login/);
  }
}
