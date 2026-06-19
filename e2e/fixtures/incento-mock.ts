import { test as base, type Page, type Route } from '@playwright/test';

/**
 * incento 백엔드(api.incento.kr) 모킹 fixture.
 *
 * 방침(Phase 1):
 * - `sdk/log/event` 만 가로챈다 → (1) 위젯 세션 호출을 수집해 단언, (2) canned 응답으로
 *   프로덕션 분석 데이터 오염 방지, (3) POST 응답으로 세션 id를 발급해 close PATCH와 연속성 확인.
 * - campaign/valid·auth·button-visuals 등은 실제 백엔드로 통과시킨다(위젯 iframe 정상 렌더 위해).
 *   완전 격리(캠페인까지 canned)는 iframe 콘텐츠 렌더와 충돌하므로 후순위.
 *
 * 실제 응답 형태(2026-06 캡처):
 *   POST  sdk/log/event/        -> 201 {"data":{"id":"<uuid>"}}
 *   PATCH sdk/log/event/{id}/   -> 200 {"data":{"id":"<uuid>","closed_at":"..."}}
 */

export interface LogEvent {
  method: 'POST' | 'PATCH';
  /** POST일 때 요청 body의 path (예: "/", "/mypage") */
  path?: string;
  /** POST일 때 요청 body의 type (C=클릭, R=라우트, P=팝업 등) */
  type?: string;
  /** 세션 id (POST는 발급한 id, PATCH는 URL에서 추출한 id) */
  sessionId: string;
  /** 테스트 시작 기준 경과 ms */
  t: number;
}

const LOG_EVENT_GLOB = '**/api/open/sdk/log/event/**';

export class IncentoMock {
  readonly events: LogEvent[] = [];
  private t0 = Date.now();

  async install(page: Page): Promise<void> {
    this.t0 = Date.now();
    await page.route(LOG_EVENT_GLOB, (route) => this.handle(route));
  }

  private async handle(route: Route): Promise<void> {
    const req = route.request();
    const method = req.method();
    const t = Date.now() - this.t0;

    if (method === 'POST') {
      const body = (req.postDataJSON() ?? {}) as { type?: string; path?: string };
      const id = crypto.randomUUID();
      this.events.push({ method: 'POST', path: body.path, type: body.type, sessionId: id, t });
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ data: { id } }),
      });
      return;
    }

    if (method === 'PATCH') {
      const id = req.url().match(/sdk\/log\/event\/([^/]+)\//)?.[1] ?? '';
      this.events.push({ method: 'PATCH', sessionId: id, t });
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { id, closed_at: new Date().toISOString() } }),
      });
      return;
    }

    await route.continue();
  }

  /** path로 필터된 open(POST) 이벤트들 */
  posts(path?: string): LogEvent[] {
    return this.events.filter((e) => e.method === 'POST' && (path === undefined || e.path === path));
  }

  /** 모든 close(PATCH) 이벤트들 */
  closes(): LogEvent[] {
    return this.events.filter((e) => e.method === 'PATCH');
  }

  /** 가장 최근 발급된 세션 id */
  lastSessionId(): string | undefined {
    return [...this.events].reverse().find((e) => e.method === 'POST')?.sessionId;
  }
}

export const test = base.extend<{ incento: IncentoMock }>({
  incento: async ({ page }, use) => {
    const mock = new IncentoMock();
    await mock.install(page);
    await use(mock);
  },
});

export { expect } from '@playwright/test';
