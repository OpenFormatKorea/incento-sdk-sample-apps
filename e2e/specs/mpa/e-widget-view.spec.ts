import { test } from '../../fixtures/incento-mock';
import { AppPom } from '../../pages/mpa/app.pom';
import { WidgetPom } from '../../pages/widget.pom';

/**
 * E. 위젯 내부 뷰 차이 (iframe 콘텐츠, MPA)
 * 위젯 DOM은 호스트와 무관하게 동일 → SPA와 동일 단언, WidgetPom 그대로.
 * - 비로그인: "로그인하고 혜택 받기" 노출
 * - 로그인: 공유 버튼(링크 공유하기 등) 노출
 */
test.describe('E. 위젯 내부 화면 (MPA)', () => {
  test('비로그인 사용자가 위젯을 열면 로그인 유도 화면이 보인다', async ({ page }) => {
    const app = new AppPom(page);
    const widget = new WidgetPom(page);

    await app.gotoHome();
    await widget.waitMounted();
    await widget.open();
    await widget.expectLoggedOutView();
  });

  test('로그인 사용자가 위젯을 열면 공유 버튼 화면이 보인다', async ({ page }) => {
    const app = new AppPom(page);
    const widget = new WidgetPom(page);

    await app.login();
    await widget.waitMounted();
    await widget.open();
    await widget.expectLoggedInView();
  });
});
