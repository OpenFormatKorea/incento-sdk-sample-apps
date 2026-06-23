import { test, expect } from '../../fixtures/incento-mock';
import { AppPom } from '../../pages/spa/app.pom';
import { WidgetPom } from '../../pages/widget.pom';

/**
 * F. 마이페이지 넛징 배너 (커스텀 트리거)
 *
 * 마이페이지의 넛징 배너를 클릭하면 명령형 open()이 호출되어 위젯이 열린다.
 * 런처 클릭(C)과 달리 공개 메서드 open으로 연 케이스이므로 오픈 방식은 E로 기록된다.
 */
test.describe('F. 마이페이지 넛징 배너', () => {
  test('배너를 클릭하면 위젯이 열린다(오픈 방식 E)', async ({ page, incento }) => {
    const app = new AppPom(page);
    const widget = new WidgetPom(page);

    await app.login();
    await widget.waitMounted();

    await app.navTo('마이페이지');
    await expect(page).toHaveURL(/\/mypage/);

    await app.clickNudgeBanner();

    await widget.expectOpen();
    await expect.poll(() => incento.posts('/mypage').length).toBeGreaterThan(0);
    expect(incento.posts('/mypage')[0]?.type).toBe('E');
  });
});
