# incento-sdk-sample-apps

고객사가 Incento SDK를 자체 앱/웹에 연동하는 방법을 보여주는 **플랫폼별 샘플 앱 모음**.
SDK 자체가 아니라 SDK 소비자다.
앱별 스택·시나리오는 `README.md` 참고.

## 형제 레포 — 함께 고칠 때가 많다

SDK 동작을 바꾸면 아래 세 레포가 세트로 움직인다. (경로는 로컬 `~/` 기준)

- `scripts` (`src/sdk/`) — JS SDK **원본**. 번들 결과가 `s3.incento.kr/scripts/sdk/incento.min.js`로 배포되고, 웹 샘플들이 이 스니펫을 로드한다.
- `incento-developers` (`content/docs/`) — 개발자센터([developers.incento.kr](https://developers.incento.kr)) 문서 원본.
- **이 레포** — 위 SDK/문서 변경이 실제로 어떻게 쓰이는지 보여주는 샘플.

SDK API·동작을 바꿨다면: 여기 샘플 코드 + 개발자센터 문서를 같이 동기화했는지 확인.

## 네이티브 IncentoService는 원본이 아니라 사본

- `app-native_android/.../IncentoService.kt`, `app-native_ios/app-native_ios/IncentoService.swift`
  는 `scripts/src/sdk/snippets/` 에서 동기화된 **사본**이다.
- 여기서 임의로 수정하지 말고 스니펫을 원본으로 삼아 sync 한다 (`chore/sync-native-snippets` 브랜치 참고).

## 공통 시나리오가 사양의 원천

5개 앱은 모두 **동일한 3탭 시나리오(A~F)** 를 구현해야 한다. 동작을 바꾸기 전에 사양부터 읽을 것:

- 개요: `README.md`
- 웹 실행 사양: `e2e/specs/{mpa,spa}/{a..f}-*.spec.ts`
- 네이티브 수동 사양: `e2e/native-checklist.md`

## 테스트

- **웹(spa/mpa)**: `e2e/` Playwright.
- **네이티브**: 프록시 없이 수동 확인 — `e2e/native-checklist.md`.
  `boot(debug:true)` 로그 접두사로 구분: `[Incento]`(SDK 일반 로그) vs `[Incento-test]`(이 앱에 넣은 세션 추적 로그).