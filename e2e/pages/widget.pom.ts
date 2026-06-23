import { type Page, type Locator, type FrameLocator, expect } from '@playwright/test';

/**
 * incento 위젯 상호작용 Page Object.
 * 위젯 관련 셀렉터/동작을 한 곳에 모은다(단일 진실 공급원).
 *
 * 주의:
 * - 위젯이 열리면 iframe이 런처 좌표를 덮어 일반 클릭이 가로채진다 → open/close는 JS dispatch.
 * - 닫기 버튼은 cross-origin iframe 내부가 아니라 호스트 DOM의 `.incento_widget__close_btn`.
 * - 고정 sleep 대신 클래스/표시 상태를 web-first assertion으로 대기.
 */
export class WidgetPom {
  readonly launcher: Locator;
  readonly container: Locator;
  readonly closeButton: Locator;
  readonly iframe: FrameLocator;

  constructor(private readonly page: Page) {
    this.launcher = page.locator('#incento-launcher');
    this.container = page.locator('#incento-widget');
    this.closeButton = page.locator('.incento_widget__close_btn');
    this.iframe = page.frameLocator('#incento_iframe');
  }

  /** SDK가 위젯을 마운트할 때까지 대기(캠페인 조회 후 런처 생성). */
  async waitMounted(): Promise<void> {
    await expect(this.launcher).toBeAttached({ timeout: 20_000 });
  }

  async expectLauncherVisible(): Promise<void> {
    await expect(this.launcher).toBeVisible();
  }

  async expectLauncherHidden(): Promise<void> {
    await expect(this.launcher).toBeHidden();
  }

  async isOpen(): Promise<boolean> {
    const cls = (await this.container.getAttribute('class')) ?? '';
    return cls.includes('incento_widget_open');
  }

  async expectOpen(): Promise<void> {
    await expect(this.container).toHaveClass(/incento_widget_open/);
  }

  /** 위젯 열기(런처 클릭). iframe 오버레이 회피 위해 JS dispatch. */
  async open(): Promise<void> {
    if (await this.isOpen()) return;
    await this.page.evaluate(() =>
      (document.querySelector('#incento-launcher') as HTMLElement | null)?.click(),
    );
    await expect(this.container).toHaveClass(/incento_widget_open/);
  }

  /** 위젯 닫기(닫기 버튼). */
  async close(): Promise<void> {
    if (!(await this.isOpen())) return;
    await this.page.evaluate(() =>
      (document.querySelector('.incento_widget__close_btn') as HTMLElement | null)?.click(),
    );
    await expect(this.container).toHaveClass(/incento_widget_close/);
  }

  /** 위젯 내부 [로그인] 버튼 클릭(iframe 내부). */
  async clickLoginInWidget(): Promise<void> {
    await this.iframe.getByText('로그인').first().click();
  }

  /** 비로그인 뷰: "로그인하고 혜택 받기" 노출 */
  async expectLoggedOutView(): Promise<void> {
    await expect(this.iframe.getByText('로그인')).toBeVisible();
  }

  /** 로그인 뷰: 공유 버튼 노출 */
  async expectLoggedInView(): Promise<void> {
    await expect(this.iframe.getByText('공유하기').first()).toBeVisible();
  }

  /**
   * 위젯 내부 [공유하기] 클릭 → widget-event(리퍼럴 시도) 기록.
   * 주의: 활성화(fixme 해제) 시 실제 공유 UI 흐름(카카오/복사 등)에 맞게
   * 셀렉터·후속 동작을 검증할 것.
   */
  async share(): Promise<void> {
    await this.iframe.getByText('공유하기').first().click();
  }
}
