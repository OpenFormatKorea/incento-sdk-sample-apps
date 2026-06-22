import { test, expect } from '../fixtures/incento-mock';
import { AppPom } from '../pages/app.pom';
import { WidgetPom } from '../pages/widget.pom';

/**
 * A. 위젯 버튼 노출 매트릭스
 *
 * | 라우트         | 비로그인  | 로그인 |
 * | /            | 노출     | 노출   |
 * | /products    | 숨김     | 숨김   |
 * | /mypage      | (→login)| 노출   |
 * | /login       | 숨김     | —      |
 */
test.describe('A. 위젯 버튼 노출 규칙', () => {
  test('비로그인 사용자에게는 홈에서만 위젯 버튼이 보인다', async ({ page }) => {
    const app = new AppPom(page);
    const widget = new WidgetPom(page);

    await test.step('홈에 들어가면 위젯 버튼이 보인다', async () => {
      await app.gotoHome();
      await widget.waitMounted();
      await widget.expectLauncherVisible();
    });

    await test.step('상품 목록으로 이동하면 위젯 버튼이 사라진다', async () => {
      await app.navTo('상품 목록');
      await expect(page).toHaveURL(/\/products/);
      await widget.expectLauncherHidden();
    });

    await test.step('로그인 없이 마이페이지에 들어가면 로그인 화면으로 보내지고 버튼은 보이지 않는다', async () => {
      await page.goto('/mypage');
      await expect(page).toHaveURL(/\/login/);
      await widget.expectLauncherHidden();
    });
  });

  test('로그인 사용자에게는 홈과 마이페이지에서 위젯 버튼이 보인다', async ({ page }) => {
    const app = new AppPom(page);
    const widget = new WidgetPom(page);

    await test.step('로그인하고 홈에 있으면 위젯 버튼이 보인다', async () => {
      await app.login();
      await widget.waitMounted();
      await widget.expectLauncherVisible();
    });

    await test.step('상품 목록에서는 로그인 상태여도 위젯 버튼이 사라진다', async () => {
      await app.navTo('상품 목록');
      await expect(page).toHaveURL(/\/products/);
      await widget.expectLauncherHidden();
    });

    await test.step('마이페이지로 이동하면 위젯 버튼이 다시 보인다', async () => {
      await app.navTo('마이페이지');
      await expect(page).toHaveURL(/\/mypage/);
      await widget.expectLauncherVisible();
    });
  });
});
