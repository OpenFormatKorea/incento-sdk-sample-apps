import { type Page, expect } from '@playwright/test';

/**
 * web-mpa 앱(호스트) 네비게이션/인증 Page Object.
 *
 * SPA와의 차이(중요):
 * - 모든 이동이 하드 네비게이션(전체 리로드) → 페이지마다 Incento('boot') 재실행.
 * - 인증은 서버 액션이 굽는 쿠키('userId')로 유지 → page.goto 후에도 로그인 상태 보존
 *   (SPA처럼 인메모리가 아니므로 새로고침으로 소실되지 않음).
 * - 로그인/로그아웃은 폼 제출 → window.location.assign 하드 리다이렉트.
 *   초기 boot와 겹치는 마운트 레이스가 없어 SPA POM 같은 사전 대기가 불필요.
 */
export class AppPom {
  constructor(private readonly page: Page) {}

  async gotoHome(): Promise<void> {
    await this.page.goto('/');
  }

  /** 상단 Nav 링크(`<a href>`)로 이동 — 하드 네비게이션. */
  async navTo(label: '홈' | '상품 목록' | '마이페이지'): Promise<void> {
    await this.page.getByRole('link', { name: label }).click();
  }

  /**
   * /login 폼으로 직접 로그인 → returnUrl(기본 '/')로 하드 리다이렉트.
   * MPA는 password를 검증하지 않지만(actions.ts) 폼 필드는 required라 채워준다.
   */
  async login(username = 'member_001', password = 'pw1234', returnUrl = '/'): Promise<void> {
    await this.page.goto(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
    await this.page.getByPlaceholder('아이디').fill(username);
    await this.page.getByPlaceholder('비밀번호').fill(password);
    await this.page.getByRole('button', { name: '로그인' }).click();
    // 폼 제출 → 서버 액션 → window.location.assign(returnUrl) 하드 리다이렉트.
    // /login을 실제로 벗어날 때까지 기다려야 이후 open()이 진행 중 네비게이션과 충돌하지 않는다.
    await this.page.waitForURL((url) => !url.pathname.startsWith('/login'));
  }

  /** 마이페이지에서 로그아웃 → /login. */
  async logout(): Promise<void> {
    await this.page.getByRole('button', { name: '로그아웃' }).click();
    await expect(this.page).toHaveURL(/\/login/);
  }
}
