import { test, expect } from '../../fixtures/incento-mock';
import { AppPom } from '../../pages/mpa/app.pom';
import { WidgetPom } from '../../pages/widget.pom';

/**
 * B. 위젯 세션 로깅 (MPA)
 *
 * 실측된 MPA 동작(SPA와 비교):
 * - 세션 POST는 **위젯 오픈 시점**에만 발생. boot/페이지 로드만으로는 생기지 않음(SPA와 동일).
 * - 런처 클릭 오픈은 type "C". 닫으면 그 세션에 PATCH.
 * - 같은 경로에서 닫았다 다시 열면 **세션 재사용**(새 POST 없음, id 유지) — SPA와 동일.
 * - 다른 페이지로의 이동은 **하드 네비게이션(전체 리로드)**. 그 페이지에서 처음 열면 새 경로로
 *   새 세션이 생성됨(type "C").
 *   ⚠️ SPA와 차이: 하드 네비로 페이지를 떠날 때 직전 세션의 close PATCH는 전송되지 않음
 *      (페이지가 언로드되며 닫기 이벤트를 태울 수 없음). "이동만으로는 기록 안 됨"은
 *      성립하지만, 이유는 boot가 자동 POST를 하지 않기 때문.
 */
test.describe('B. 방문 세션 기록 (MPA)', () => {
  test('홈에서 위젯을 열면 홈 방문이 기록된다(오픈 방식 C)', async ({ page, incento }) => {
    const app = new AppPom(page);
    const widget = new WidgetPom(page);

    await app.gotoHome();
    await widget.waitMounted();
    await widget.open();

    await expect.poll(() => incento.posts('/').length).toBeGreaterThan(0);
    expect(incento.posts('/')[0]?.type).toBe('C');
  });

  test('같은 페이지에서 위젯을 다시 열어도 새 방문 세션은 만들어지지 않는다', async ({ page, incento }) => {
    const app = new AppPom(page);
    const widget = new WidgetPom(page);

    await app.gotoHome();
    await widget.waitMounted();
    await widget.open();
    await expect.poll(() => incento.posts('/').length).toBeGreaterThan(0);

    const sessionId = incento.lastSessionId();
    expect(sessionId).toBeTruthy();

    await widget.close();
    await widget.open();

    // 같은 경로 재오픈: 새 세션 없이 종료된 세션 id를 재사용
    expect(incento.lastSessionId()).toBe(sessionId);
  });

  test('위젯을 닫으면 열려 있던 그 세션이 종료로 기록된다', async ({ page, incento }) => {
    const app = new AppPom(page);
    const widget = new WidgetPom(page);

    await app.gotoHome();
    await widget.waitMounted();
    await widget.open();
    await expect.poll(() => incento.posts('/').length).toBeGreaterThan(0);

    const openedSessionId = incento.lastSessionId();
    expect(openedSessionId).toBeTruthy();

    await widget.close();

    await expect
      .poll(() => incento.closes().some((e) => e.sessionId === openedSessionId))
      .toBe(true);
  });

  test('재오픈 후 다시 닫으면 같은 세션에 close PATCH가 또 전송된다(닫을 때마다 PATCH)', async ({
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

    const sessionId = incento.lastSessionId();
    expect(sessionId).toBeTruthy();

    await test.step('1차 닫기 → 그 세션에 close PATCH 1건', async () => {
      await widget.close();
      await expect
        .poll(() => incento.closes().filter((e) => e.sessionId === sessionId).length)
        .toBe(1);
    });

    await test.step('같은 경로 재오픈 → 새 세션 없이 종료된 세션 id를 재사용', async () => {
      await widget.open();
      expect(incento.lastSessionId()).toBe(sessionId);
    });

    await test.step('2차 닫기 → 중복 제거 없이 같은 세션에 close PATCH가 또 전송된다', async () => {
      await widget.close();
      await expect
        .poll(() => incento.closes().filter((e) => e.sessionId === sessionId).length)
        .toBe(2);
    });
  });

  test('하드 네비게이션으로 다른 페이지로 이동 후 위젯을 열면 해당 경로로 새 위젯 세션이 생긴다', async ({
    page,
    incento,
  }) => {
    const app = new AppPom(page);
    const widget = new WidgetPom(page);

    await test.step('로그인하고 홈에서 위젯을 열면 홈 세션이 생긴다', async () => {
      await app.login();
      await widget.waitMounted();
      await widget.open();
      await expect.poll(() => incento.posts('/').length).toBeGreaterThan(0);
    });

    const homeSession = incento.lastSessionId();

    await test.step('마이페이지로 하드 네비만 하면 아직 그 페이지 세션은 없다', async () => {
      await app.navTo('마이페이지');
      await expect(page).toHaveURL(/\/mypage/);
      // 페이지 로드(boot)만으로는 POST 없음 — 위젯을 열어야 생성됨
      expect(incento.posts('/mypage').length).toBe(0);
    });

    await test.step('마이페이지에서 위젯을 열면 새 경로로 새 세션이 생긴다(type C)', async () => {
      await widget.waitMounted();
      await widget.open();
      await expect.poll(() => incento.posts('/mypage').length).toBeGreaterThan(0);
      expect(incento.posts('/mypage')[0]?.type).toBe('C');
      expect(incento.lastSessionId()).not.toBe(homeSession);
    });
  });

  test('같은 페이지에서 닫았다 다시 열고 공유하면, 그 공유가 재사용된 세션 id로 기록된다', async ({
    page,
    incento,
  }) => {
    const app = new AppPom(page);
    const widget = new WidgetPom(page);

    await app.login(); // 공유 버튼은 로그인 뷰에 노출
    await widget.waitMounted();
    await widget.open();
    await expect.poll(() => incento.posts('/').length).toBeGreaterThan(0);

    const sessionId = incento.lastSessionId();
    expect(sessionId).toBeTruthy();

    await widget.close();
    await widget.open(); // 같은 경로 재오픈 → 새 세션 없음
    expect(incento.lastSessionId()).toBe(sessionId);

    // 재오픈 후 공유 → widget-event가 재사용된 sessionId로 기록되어야 한다
    await widget.share();
    await expect.poll(() => incento.lastWidgetEvent()?.eventId).toBe(sessionId);
  });
});
