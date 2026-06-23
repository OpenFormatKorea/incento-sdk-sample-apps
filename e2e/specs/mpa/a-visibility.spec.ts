import { test, expect } from '../../fixtures/incento-mock';
import { AppPom } from '../../pages/mpa/app.pom';
import { WidgetPom } from '../../pages/widget.pom';

/**
 * A. 위젯 버튼 노출 매트릭스 (MPA)
 *
 * 노출은 페이지별 boot `visible` 파라미터(IncentoBoot.tsx)로 결정된다.
 *   /         IncentoBoot(visible=true)  → 노출
 *   /products IncentoBoot(visible=false) → 숨김
 *   /login    IncentoBoot(visible=false) → 숨김
 *   /mypage   IncentoBoot(visible=true)  → 노출
 *
 * 접근 제어는 proxy.ts(Next middleware)가 담당 — SPA의 ProtectedRoute와 동일:
 *   /mypage + 비로그인 → /login 리다이렉트, /login + 로그인 → / 리다이렉트.
 *
 * | 라우트      | 비로그인      | 로그인 |
 * | /          | 노출         | 노출   |
 * | /products  | 숨김         | 숨김   |
 * | /mypage    | (→ /login)   | 노출   |
 * | /login     | 숨김         | —      |
 */
test.describe('A. 위젯 버튼 노출 규칙 (MPA)', () => {
  test('비로그인: 홈에서만 노출, 상품목록 숨김, 마이페이지는 로그인으로 리다이렉트', async ({ page }) => {
    const app = new AppPom(page);
    const widget = new WidgetPom(page);

    await test.step('홈에 들어가면 위젯 버튼이 보인다', async () => {
      await app.gotoHome();
      await widget.waitMounted();
      await widget.expectLauncherVisible();
    });

    await test.step('상품 목록(하드 네비)에서는 위젯 버튼이 사라진다', async () => {
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

  test('로그인: 홈/마이페이지 노출, 상품목록 숨김', async ({ page }) => {
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
