# e2e (web-spa)

incento SDK 연동 동작을 검증하는 Playwright E2E 테스트.

## 실행
```bash
cd e2e
npm install
npx playwright install chromium   # 최초 1회 (브라우저 바이너리)
npm test                          # web-spa dev 서버 자동 기동 후 실행
npm run test:headed               # 브라우저 보면서
npm run report                    # 마지막 리포트
```
webServer가 `npm run dev --prefix ../web-spa`로 web-spa dev 서버를 기동함.

## 구성
- `playwright.config.ts` — web-spa(:5173) 자동 기동, chromium 단일 프로젝트.
- `fixtures/incento-mock.ts` — `api.incento.kr`의 `sdk/log/event`만 가로채 수집+canned 응답.
- `pages/widget.pom.ts` — 위젯(런처/닫기/iframe) 상호작용.
- `pages/app.pom.ts` — 앱 네비게이션/로그인/로그아웃.
- `specs/` — 시나리오 A~E.

## 모킹 경계 (Phase 1)
- 모킹: `sdk/log/event` (세션 호출 수집 + 프로덕션 분석 오염 방지 + 세션 id 발급).
- 실제 통과: campaign/valid·auth·button-visuals 및 위젯 iframe(`widget.incento.kr`).
  - 위젯 iframe 렌더가 실제 캠페인에 의존하므로 의도적으로 실 호출 유지.
  - 완전 격리(캠페인까지 canned)는 후순위.

자세한 전략/시나리오는 상위 `../TESTING_PLAN.md`, 동작 근거는 `../widget-session-test-results.md` 참고.

## 알려진 동작/주의
- 세션 로그는 "위젯 open 클릭"이 아니라 **경로 진입 시점**에 전송됨(SPA: 단일 iframe + incentoPathChange).
- 위젯이 열리면 iframe이 런처를 덮으므로 open/close는 JS dispatch로 처리(POM 내부).
- `/login` 진입 직후 곧바로 로그인하면 초기 boot와 shutdown/boot가 겹쳐 런처가 중복 마운트되는
  레이스가 있음 → POM `login()`은 초기 마운트 완료를 기다린 뒤 진행.
