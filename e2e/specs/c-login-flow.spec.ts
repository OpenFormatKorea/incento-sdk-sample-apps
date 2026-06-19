import { test, expect } from '../fixtures/incento-mock';
import { AppPom } from '../pages/app.pom';
import { WidgetPom } from '../pages/widget.pom';

/**
 * C. 로그인 플로우
 * 위젯 내 [로그인] 클릭 → 세션 종료(PATCH) + loginRequired(→/login)
 *   → 폼 제출 → 홈 복귀 → 위젯 자동 열림(type P)
 */
test.describe('C. 로그인 플로우', () => {
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

      // loginRequired → /login 이동
      await expect(page).toHaveURL(/\/login\?show_incento_popup=true/);
      // 세션 종료 PATCH (직전 세션)
      await expect
        .poll(() => incento.closes().some((e) => e.sessionId === sessionBeforeLogin))
        .toBe(true);
    });

    await test.step('로그인을 마치면 홈으로 돌아오고 위젯이 다시 열린다', async () => {
      await page.getByPlaceholder('아이디').fill('member_001');
      await page.getByPlaceholder('비밀번호').fill('pw1234');
      await page.getByRole('button', { name: '로그인' }).click();
      // 홈 복귀(자동 열림 파라미터)
      await expect(page).toHaveURL(/\/\?incento_popup=true/);

      // 로그인 후 위젯이 다시 열리며 세션 로그(type P) 전송
      await widget.waitMounted();
      await expect.poll(() => incento.posts('/').length).toBeGreaterThan(0);
    });
  });
});
