# SDK 연동 테스트 가이드

incento SDK를 호스트 앱에 연동했을 때 **"올바른 시점에, 올바른 파라미터로, 올바른 위젯 세션 호출이 일어나는가"** 를 검증하는 E2E 테스트의 운영 문서입니다. 테스트를 유지보수하거나 새 플랫폼(앱)을 추가하려는 개발자를 위한 것입니다.

> SDK 내부 로직(`scripts/src/sdk`)의 단위 검증은 이 문서의 범위가 아닙니다. 여기서는 **호스트 앱 ↔ SDK ↔ 위젯 iframe** 의 연동 동작만 다룹니다.

대상 앱:
- **web-spa** — Vite + react-router, 소프트 네비게이션(SPA). `:5173`. **A~E 구현 완료.**
- **web-mpa** — Next.js, 하드 네비게이션(전통적 MPA). `:3000`. **A~E 구현 완료.**

---

## 원칙

1. **백엔드 격리** — `api.incento.kr`를 Playwright `page.route()`로 모킹.
   - 캠페인 응답을 canned로 → 라이브 캠페인 없이도 위젯이 항상 동일하게 마운트.
   - `sdk/log/event`를 **수집(단언용)** 하고 canned 응답 반환 → **프로덕션 분석 오염 방지** + 세션 id 발급.
2. **재현성** — 고정 `sleep` 금지. `expect.poll` / `waitForResponse` / web-first assertion만 사용.
3. **단일 진실 공급원(SSOT)** — 위젯 상호작용 셀렉터·동작은 `pages/widget.pom.ts` 한 곳에만.
4. **공유 우선** — 위젯 DOM·API는 호스트와 무관하게 동일하므로 fixtures와 `widget.pom.ts`는 모든 플랫폼이 공유. 갈라지는 것은 호스트 앱 조작(`app.pom.ts`)과 시나리오 spec뿐.

---

## 디렉터리 구조

`e2e/`를 앱 바깥 루트에 두는 이유: fixtures(`incento-mock.ts`)와 위젯 POM(`widget.pom.ts`) 같은 **공통 자산을 web-spa·web-mpa·webview 등 여러 Playwright project가 공유**하기 위함입니다.

```
sdk-test-apps/
  e2e/
    playwright.config.ts        # project별(web-spa/web-mpa) testDir·baseURL 분리, webServer 배열
    fixtures/
      incento-mock.ts           # 공유: api.incento.kr 가로채기 + 요청 수집기(logEvents)
    pages/
      widget.pom.ts             # 공유: 런처/닫기버튼/iframe — open()/close()/expect*()
      spa/app.pom.ts            # SPA 전용: 링크 클릭 네비, 로그인 마운트 레이스 회피
      mpa/app.pom.ts            # MPA 전용: 하드 네비, 쿠키 인증
    specs/
      spa/                      # SPA 시나리오 A~E
      mpa/                      # MPA 시나리오 A~E
  web-spa/__tests__/            # vitest: 순수 규칙 단위 테스트
```

> spec은 처음부터 공통 추상화(시나리오 팩토리에 AppPom 주입)하지 말 것. SPA/MPA는 세션 로깅·로그인 흐름의 검증 내용 자체가 달라서, 섣불리 묶으면 분기가 늘어납니다. **앱별로 복제해서 시작**하고, 중복이 실제로 굳어지면 그때 공통 헬퍼로 추출하세요.

### playwright.config.ts 핵심

project마다 `testDir`를 분리하고 `baseURL`을 project의 `use`로 내립니다. `webServer`는 배열로 두 dev 서버를 함께 기동합니다.

```ts
projects: [
  { name: 'web-spa', testDir: './specs/spa',
    use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:5173' } },
  { name: 'web-mpa', testDir: './specs/mpa',
    use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:3000' } },
],
webServer: [
  { command: 'npm run dev --prefix ../web-spa', url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI, timeout: 60_000 },
  { command: 'npm run dev --prefix ../web-mpa', url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI, timeout: 120_000 },
],
```

---

## 실행

```bash
cd e2e
npm install
npx playwright install chromium   # 최초 1회 (브라우저 바이너리)

npm test                          # 전체(web-spa + web-mpa) — dev 서버 자동 기동
npx playwright test --project=web-spa   # SPA만
npx playwright test --project=web-mpa   # MPA만
npm run test:headed               # 브라우저 보면서
npm run report                    # 마지막 리포트
```

---

## 모킹 경계 (격리 범위)

| 구분 | 대상 | 이유 |
|---|---|---|
| **모킹** | `api.incento.kr` (campaign/valid·log/event·auth·button-visuals) | 라이브 캠페인 없이 항상 동일 마운트, 분석 오염 방지, 세션 id 발급 |
| **실 로드 유지** | SDK 스크립트(`s3.incento.kr/.../incento.min.js`), 위젯 iframe(`widget.incento.kr/v2`) | `sdk/log/event`는 **위젯 iframe 앱이** 전송하므로, 실제로 태워야 연동을 검증함 |

한계: 외부 정적 자산(SDK 스크립트·위젯 iframe)에 의존합니다. 추후 flaky의 원인이 되면 위젯 iframe을 로컬 fake로 대체하는 hermetic 모드를 추가하는 것이 다음 수순입니다.

---

## SPA vs MPA 동작 차이 (반드시 숙지)

같은 시나리오라도 검증 내용이 갈리는 핵심 원인입니다. 코드로 확인된 차이입니다.

| 항목 | web-spa | web-mpa |
|---|---|---|
| 네비게이션 | 링크 클릭 = 소프트 네비(상태 유지) | `<a href>` = **하드 네비(전체 리로드)** |
| SDK 부트 | 1회 boot 후 `incentoPathChange`/`setPath` | **페이지마다 `Incento('boot')` 재실행** (`IncentoBoot.tsx`) |
| 인증 유지 | 인메모리 (`page.goto` 시 소실) | **쿠키 `userId`** (리로드해도 유지) |
| 위젯 노출 제어 | `INCENTO_WIDGET_ALLOW_PAGES` + setPath | 페이지별 boot `visible` 파라미터 |
| 로그인 유도 | 인메모리 type P 자동 오픈 | `loginRequired` → `window.location` 이동, returnUrl의 `incento_popup=true` 쿼리로 자동 오픈 |
| 라우트 이동 도구 | **링크 클릭** (`page.goto`는 새로고침→로그인 소실) | `page.goto`·링크 모두 하드 로드, 쿠키로 인증 유지 |

---

## 시나리오 A–E

각 시나리오의 **의미는 공통**이지만, 위 차이 때문에 단언 포인트가 갈립니다.

### A. 위젯 버튼 노출

노출 매트릭스는 SPA/MPA 공통:

| 라우트 | 비로그인 | 로그인 |
|---|---|---|
| `/` 홈 | 노출 | 노출 |
| `/products` | 숨김 | 숨김 |
| `/mypage` | (→ `/login` 리다이렉트) | 노출 |
| `/login` | 숨김 | — |

- **SPA**: 노출은 `INCENTO_WIDGET_ALLOW_PAGES` + setPath 기반. 런처를 숨겨도 setPath는 전송됨. 접근 제어는 `ProtectedRoute`.
- **MPA**: 노출은 페이지별 boot `visible` 파라미터 기반. 접근 제어는 `proxy.ts`(Next middleware) — `/mypage` 비로그인 → `/login`, `/login` 로그인 → `/`.
- WidgetPom 셀렉터는 공유 → 위젯 조작 부분은 그대로 포팅.

### B. 위젯 세션 로깅 (핵심)

- **SPA** — 단일 iframe + 경로 변경 모델:
  - `/` 진입 → `POST log/event {path:"/"}`
  - `/products` 진입 → `POST log/event {path:"/products"}` (런처 숨겨도 setPath 전송 — 현 구현상 정상)
  - 위젯 닫기 → `PATCH log/event/{sid}`
  - 세션 연속성: open POST가 반환한 `session_id` == 직후 close PATCH path의 id
- **MPA** — 하드 네비 + 페이지별 재부팅 모델(실측):
  - 세션 POST는 **위젯 오픈 시점**에만 발생(boot/로드만으로는 없음). 런처 클릭 오픈은 type `C`.
  - 같은 경로에서 닫았다 다시 열면 **세션 재사용**(새 POST 없이 id 유지) — SPA와 동일.
  - 다른 페이지로 이동(하드 네비)한 뒤 그 페이지에서 처음 열면 새 경로로 새 세션(type `C`).
  - ⚠️ SPA와 차이: 하드 네비로 페이지를 떠날 때 직전 세션의 close `PATCH`는 전송되지 않음(페이지 언로드).

### C. 로그인 플로우

- **SPA**: 위젯 내 [로그인] → `PATCH log/event/{sid}` + `loginRequired` → `/login` 이동 → 폼 제출 → 홈 복귀 → 위젯 인메모리 자동 열림(`type P`).
- **MPA**: 위젯 내 [로그인] → 직전 세션 `PATCH` + `loginRequired` → `/login?...&returnUrl=...incento_popup=true` **하드 이동** → 폼 제출(쿠키 set) → returnUrl 복귀 → **쿼리파라미터 기반 자동 오픈**(새 세션 type `P`).

### D. 로그아웃 플로우

- **SPA**: `/mypage` 로그아웃 → `/login` 이동, 런처 숨김.
- **MPA**: 쿠키 삭제 + 하드 이동. 동작은 거의 동일.

### E. 위젯 내부 뷰 차이 (iframe 내용)

위젯 DOM이 호스트와 무관하게 동일 → SPA/MPA 공통, WidgetPom 그대로.
- 비로그인: "로그인하고 혜택 받기" 노출
- 로그인: 공유 버튼(링크 공유하기 등) 노출

---

## 검증된 안정 셀렉터/플로우

- 런처 `#incento-launcher` / 컨테이너 `#incento-widget` (`_open`/`_close` 클래스)
- 닫기 `button.incento_widget__close_btn` (위젯이 열리면 iframe이 런처 좌표를 덮으므로 **JS dispatch** 권장)
- 위젯 로그인 버튼 `frameLocator('#incento_iframe').getByText('로그인')`
- **SPA**: 라우트 이동은 링크 클릭(소프트 네비). `page.goto`는 새로고침→인메모리 로그인 소실. `/login` 진입 직후 곧바로 로그인하면 초기 boot와 shutdown/boot가 겹쳐 런처가 중복 마운트되는 레이스가 있어 → POM `login()`은 초기 마운트 완료를 기다린 뒤 진행.
- **MPA**: 쿠키로 인증이 유지돼 `page.goto`가 안전. 폼 제출이 하드 리다이렉트라 SPA의 중복 마운트 레이스 회피 로직 불필요.

---

## 새 플랫폼/테스트 추가 가이드

새 호스트 앱(예: 또 다른 MPA, 다른 프레임워크)을 추가할 때:

1. `playwright.config.ts`에 project 추가 — 전용 `testDir`와 `baseURL`을 두고, `webServer` 배열에 dev 서버 추가.
2. `pages/<platform>/app.pom.ts` 작성 — 그 앱의 네비게이션·로그인·로그아웃 동작을 캡슐화. **위젯 조작은 절대 여기 두지 말 것**(WidgetPom 재사용).
3. `specs/<platform>/`에 A~E spec 작성 — 먼저 SPA spec을 복제한 뒤, 위 "SPA vs MPA 동작 차이"에 준해 단언을 그 앱의 부트/네비 모델에 맞게 교정.
4. fixtures(`incento-mock.ts`)와 `widget.pom.ts`는 그대로 공유.

---

## 얇은 단위 테스트 (Vitest)

E2E가 다루기엔 과한 순수 규칙은 앱별 `__tests__`에서 단위로:
- `INCENTO_WIDGET_ALLOW_PAGES` visibility, `AuthContext` login/logout, `ProtectedRoute` 리다이렉트, `getUserCreatedAt`/mockUserDb 등.

---

## 참고

- 동작 근거: `../widget-session-test-results.md`
- MPA 연동 가이드: https://developers.incento.kr/docs/sdk/web/mpa
- SPA 연동 가이드: https://developers.incento.kr/docs/sdk/web/spa
