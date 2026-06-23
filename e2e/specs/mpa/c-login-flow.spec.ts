import { test, expect } from '../../fixtures/incento-mock';
import { AppPom } from '../../pages/mpa/app.pom';
import { WidgetPom } from '../../pages/widget.pom';

/**
 * C. 로그인 플로우 (MPA)
 *
 * 실측된 흐름(layout.tsx loginRequired 핸들러 기준):
 *  위젯 [로그인] 클릭
 *    → 직전 세션 종료(PATCH)
 *    → /login?show_incento_popup=true&returnUrl=<현재URL+incento_popup=true> 하드 이동
 *    → 폼 제출(서버 액션이 userId 쿠키 set) → returnUrl로 window.location.assign(하드 이동)
 *    → returnUrl의 incento_popup=true 쿼리로 위젯 자동 오픈 → 새 세션 POST(type "P")
 *
 * SPA와의 차이: SPA는 인메모리 type P 자동 오픈, MPA는 URL 쿼리파라미터 기반 자동 오픈.
 * 단, 자동 오픈 세션 type이 "P"로 찍히는 것은 양쪽 동일.
 */
test.describe('C. 로그인 플로우 (MPA)', () => {
  test('위젯에서 로그인하면 로그인 화면을 거쳐 홈으로 돌아오고 위젯이 다시 열린다', async ({
    page,
    incento,
  }) => {
    const app = new AppPom(page);
    const widget = new WidgetPom(page);

    await test.step('홈에서 위젯을 열어 세션을 시작한다', async () => {
      await app.gotoHome();
      await widget.waitMounted();
      await widget.open();
      await expect.poll(() => incento.posts('/').length).toBeGreaterThan(0);
    });

    const sessionBeforeLogin = incento.lastSessionId();

    await test.step('위젯에서 로그인을 누르면 세션이 종료되고 로그인 화면으로 이동한다', async () => {
      await widget.clickLoginInWidget();

      await expect(page).toHaveURL(/\/login\?show_incento_popup=true/);
      await expect
        .poll(() => incento.closes().some((e) => e.sessionId === sessionBeforeLogin))
        .toBe(true);
    });

    await test.step('로그인을 마치면 홈으로 돌아오고 위젯이 다시 열린다', async () => {
      await page.getByPlaceholder('아이디').fill('member_001');
      await page.getByPlaceholder('비밀번호').fill('pw1234');
      await page.getByRole('button', { name: '로그인' }).click();

      // returnUrl(홈) + incento_popup=true 로 복귀
      await expect(page).toHaveURL(/incento_popup=true/);

      // 자동 오픈으로 새 세션이 type "P"로 기록된다
      await widget.waitMounted();
      await expect.poll(() => incento.posts('/').some((e) => e.type === 'P')).toBe(true);
      expect(incento.lastSessionId()).not.toBe(sessionBeforeLogin);
    });
  });
});
