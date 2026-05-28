# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Incento — Service Overview

**Incento** (incento.kr) is a referral marketing service built by Openformat. It automates referral-based reward campaigns for e-commerce retailers — e.g., a user shares a referral link, the referee signs up or makes a purchase, and both parties receive configurable rewards.

Incento also provides campaign analytics and referral data reporting through a dashboard.

### Incento Repository Ecosystem

| Repository | Role |
|---|---|
| `incento-back` | Django REST API backend. All business logic — campaigns, referrals, rewards, orders. Serves two API surfaces: platform-specific APIs (Cafe24, MakeShop) and the Open API (`/api/open/`) for platform-agnostic integrations. |
| `scripts` | Public SDK source (`src/sdk/`). Compiled and hosted at `https://s3.incento.kr/scripts/sdk/incento.min.js`. This is the JavaScript snippet that independent shopping malls inject into their frontend. |
| `widget-cafe24` | React/Next.js app that renders inside the SDK widget iframe. When a user clicks the widget launcher button, the SDK opens an iframe whose content is served from `widget-cafe24`. It handles the full widget UI — user login, referral link sharing (Kakao, Naver, X/Twitter, copy link), reward/coupon display — by calling `incento-back` APIs directly. Supports multiple widget versions (v1, v2, v3) and per-merchant custom views. |
| `dashboard_v2` | Next.js dashboard (public-facing). Marketers and developers use this to configure campaigns and view referral analytics. Also surfaces the Open API credentials (public key / secret key) needed to integrate the SDK. |
| `sdk-test-apps` | **This repository.** Sample apps across different frontend environments, used to test the public SDK integration end-to-end. |

---

## This Repository — sdk-test-apps

### Purpose

Incento originally operated only on managed e-commerce platforms (Cafe24, MakeShop). To support **independent shopping malls and arbitrary websites**, Openformat built:

1. **Open API** (`incento-back/openformat/open/`) — platform-agnostic backend endpoints, authenticated via public key (`X-Incento-Key: inc_pk_...`) or secret key (`X-Incento-Key: inc_sk_...`).
2. **Public SDK** (`scripts/src/sdk/`) — a JavaScript snippet that independent malls inject into their frontend. The SDK calls the Open API to handle user login/registration, campaign matching, widget display, referral link tracking, and event logging.

`sdk-test-apps` was created to simulate the full range of frontend environments that will use this SDK — verifying that the SDK integration works correctly across each platform type.

### App Scenarios

Each app implements the same 3-tab scenario: **Home / Products / My Page**

- **Before login**: Widget shown on Home tab. Widget login button → redirects to My Page → after login, widget auto-opens.
- **After login**: Widget shown on Home and My Page tabs. Share link button visible in widget.
- **After logout**: Widget shown on Home tab only. Login button visible in widget.

### App Environments

| Directory | Stack | Notes |
|---|---|---|
| `web-spa/` | Vite + React (TypeScript) | Single-page app. SDK injected via `IncentoService` class in `src/incento.service.ts`. |
| `web-mpa/` | Next.js (PNPM) | Multi-page app. Has its own `CLAUDE.md` — read it before working in this directory. |
| `app-webview_cross_platform/` | React Native (WebView) | Cross-platform app that embeds a web view. SDK runs inside the web layer. |
| `app-native_android/` | Kotlin + Jetpack Compose | Native Android. SDK calls are made through `IncentoService.kt` via a WebView. |
| `app-native_ios/` | Swift + SwiftUI | Native iOS. SDK integration via `AuthManager.swift` and a WKWebView. |

#### Widget iframe

When the SDK widget launcher is clicked in any of these apps, the SDK opens an **iframe** whose content is served from the `widget-cafe24` repository (a separate React/Next.js app). The iframe is the actual widget UI — it handles login, referral link sharing (Kakao, Naver, X/Twitter, copy link), and reward/coupon display by calling `incento-back` APIs directly. The test apps in this repo are responsible for correctly loading and booting the SDK; the widget content itself lives in `widget-cafe24`.

---

## SDK Integration Pattern

The public SDK is loaded asynchronously as a script tag. Each app wraps this in a service layer. The canonical web pattern (from `web-spa/src/incento.service.ts`):

```typescript
// 1. Load the script (async, idempotent)
loadScript()  // injects https://s3.incento.kr/scripts/sdk/incento.min.js

// 2. Boot with shop credentials and optional user identity
window.Incento('boot', { apiKey: 'inc_pk_...', userId: '...' })

// 3. Lifecycle controls
window.Incento('show')
window.Incento('hide')
window.Incento('shutdown')

// 4. Event listeners
window.Incento('on', 'loginRequired', handler)
window.Incento('on', 'widgetOpen', handler)
window.Incento('on', 'widgetClose', handler)
```

The SDK internally calls the Open API endpoints under `/api/open/sdk/`:
- `POST /api/open/sdk/campaign/valid/` — find matching active campaign
- `POST /api/open/sdk/auth/login-or-register/` — authenticate/register end-user, returns JWT
- `POST /api/open/sdk/link/transaction/check/` — record referral from transaction link
- `GET  /api/open/sdk/widget/button-visuals/<campaign_id>/` — fetch widget button styles
- `POST /api/open/sdk/log/event/` — log SDK events (impressions, clicks)
- `POST /api/open/sdk/log/widget-event/` — log widget interaction events

---

## Git Commits

**CLAUDE CODE MUST NEVER run `git add` or `git commit`.** The user manages all git staging and commits manually.

This applies at all times, regardless of context.

---

## Sub-directory CLAUDE.md Files

Some sub-apps have their own `CLAUDE.md` or `AGENTS.md` with environment-specific guidance. Always read the sub-directory's file before working in that directory.

- `web-mpa/CLAUDE.md` — references `AGENTS.md` with Next.js version-specific warnings
