# incento-sdk-sample-apps — agent guide

Per-platform reference apps showing customers how to embed the Incento widget/SDK outside Cafe24/MakeShop: `web-spa/` (Vite + React), `web-mpa/` (Next.js 16), `app-webview_cross_platform/` (React Native), `app-native_android/` (Kotlin/Compose), `app-native_ios/` (Swift/SwiftUI), plus a shared `e2e/` Playwright suite.

Root monorepo CLAUDE.md is also loaded in monorepo sessions — don't duplicate it.

## Load order (JIT)

- Root `README.md` (Korean) — platform matrix + the shared 3-tab UX scenario every sample implements. Read first.
- `e2e/README.md` (Korean, detailed) — mocking boundary (mock api.incento.kr; keep the real SDK script + widget iframe), SPA-vs-MPA behavioral differences, scenarios, stable selectors. Read before touching tests or adding a platform.
- `web-mpa/AGENTS.md` — **Next.js 16 differs from training data; read it before editing web-mpa.**
- Each sample's own README for its toolchain.

## Key facts

- Each sample is an independent project with its own toolchain (npm / Gradle / Xcode + Pods) — there is no root package manager; `cd` into the target app.
- Web samples load the hosted SDK (`https://s3.incento.kr/scripts/sdk/incento.min.js`) through a thin `incento.service.ts` wrapper and drive the queue-based `Incento(...)` global (`boot/show/hide/open/close/setPath/on`).
- Native samples reimplement the same lifecycle directly against `https://api.incento.kr/api/open` and render `https://widget.incento.kr/v2` in a WebView.
- SPA and MPA intentionally diverge (navigation, boot timing, auth persistence) — don't "unify" them; the divergence is documented behavior.
- Samples must track SDK behavior in `scripts/src/sdk/` and docs in `developers/`.

This is a peripheral repo — expand this guide when it comes under active development.
