import { test, expect } from '../../fixtures/incento-mock';
import { AppPom } from '../../pages/mpa/app.pom';
import { WidgetPom } from '../../pages/widget.pom';

/**
 * D. 로그아웃 플로우 (MPA)
 * /mypage 로그아웃(쿠키 삭제 + 하드 이동) → /login, 런처 숨김.
 */
test.describe('D. 로그아웃 플로우 (MPA)', () => {
  test('마이페이지에서 로그아웃하면 로그인 화면으로 가고 위젯 버튼이 사라진다', async ({ page }) => {
    const app = new AppPom(page);
    const widget = new WidgetPom(page);

    await app.login();
    await widget.waitMounted();
    await app.navTo('마이페이지');
    await expect(page).toHaveURL(/\/mypage/);

    await app.logout();
    await expect(page).toHaveURL(/\/login/);
    await widget.expectLauncherHidden();
  });
});
