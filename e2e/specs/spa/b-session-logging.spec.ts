import { test, expect } from '../../fixtures/incento-mock';
import { AppPom } from '../../pages/spa/app.pom';
import { WidgetPom } from '../../pages/widget.pom';

/**
 * B. 위젯 세션 로깅 (핵심)
 *
 * 위젯 세션 생성은 특정 페이지에서 최초로 위젯을 열 때 생성됨.
 * 리퍼럴 시도 기록은 위젯 세션 생성 후 위젯 내부 공유 버튼을 누르면 기록됨.
 * 위젯 세션 하나에 각종 위젯 액션들이 붙어서 기록되는 방식임.
 * 
 * 정책(cafe24/makeshop과 동일): 위젯 세션 재생성 트리거는 "경로 변경 후 위젯 최초 오픈".
 * - 위젯 닫기 버튼 클릭 시 세션 종료
 * - 같은 페이지 재오픈은 종료된 세션 아이디로 기록 (새 세션 생성 없음).
 */
test.describe('B. 방문 세션 기록', () => {
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

    // 같은 경로 재오픈: currentPath === sessionPath → 새 세션 없음(세션 id 유지)
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

    await test.step('같은 경로 재오픈 → 새 세션 없이 세션 id 유지', async () => {
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

  test(
    '소프트 네비게이션으로 다른 페이지로 이동 후 위젯을 열면 해당 경로로 새 위젯 세션이 생긴다',
    async ({ page, incento }) => {
      const app = new AppPom(page);
      const widget = new WidgetPom(page);

      await test.step('로그인하고 홈에서 위젯을 열면 홈 세션이 생긴다', async () => {
        await app.login();
        await widget.waitMounted();
        await widget.open();
        await expect.poll(() => incento.posts('/').length).toBeGreaterThan(0);
      });

      const homeSession = incento.lastSessionId();

      await test.step('마이페이지로 이동만 하면 아직 그 페이지 세션은 없다', async () => {
        await app.navTo('마이페이지');
        await expect(page).toHaveURL(/\/mypage/);
        // 경로 변경은 currentPath만 저장 → 위젯을 다시 열기 전까지 세션 POST 없음
        expect(incento.posts('/mypage').length).toBe(0);
      });

      await test.step('마이페이지에서 위젯을 다시 열면 새 경로로 새 세션이 생긴다(type C)', async () => {
        // 위젯 버튼 클릭으로 재오픈 → incentoPathChange의 eventType "C" → 재생성 세션 type "C"
        await widget.close();
        await widget.open();
        await expect.poll(() => incento.posts('/mypage').length).toBeGreaterThan(0);
        expect(incento.posts('/mypage')[0]?.type).toBe('C');
        expect(incento.lastSessionId()).not.toBe(homeSession);
      });
    },
  );

  test(
    '같은 페이지에서 닫았다 다시 열고 공유하면, 그 공유가 재사용된 세션 id로 기록된다',
    async ({ page, incento }) => {
      const app = new AppPom(page);
      const widget = new WidgetPom(page);

      await app.login(); // 공유 버튼은 로그인 뷰에 노출
      await widget.waitMounted();
      await widget.open();
      await expect.poll(() => incento.posts('/').length).toBeGreaterThan(0);

      const sessionId = incento.lastSessionId();
      expect(sessionId).toBeTruthy();

      await widget.close(); // closed_at만 스탬프, session_id는 유지(#222)
      await widget.open(); // 같은 경로 재오픈 → 새 세션 없음
      expect(incento.lastSessionId()).toBe(sessionId);

      // 재오픈 후 공유 → widget-event가 null이 아니라 재사용된 sessionId로 기록되어야 한다
      await widget.share();
      await expect.poll(() => incento.lastWidgetEvent()?.eventId).toBe(sessionId);
    },
  );
});
