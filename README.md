# sdk-test-apps

- 배경
  - 인센토는 플랫폼(cafe24, makeshop) 의존적 서비스로 출발함
  - 비즈니스 확장을 위해 독립몰 지원이 가능하도록 SDK를 개발함
- 목적
  - 실제 개발 환경에서 SDK를 테스트하기 위해 이 레포에 각 환경을 구성함
- 환경별 앱 구성
  - `/app-native_android` Kotlin, Jetpack Compose
  - `/app-native_ios` Swift, SwiftUI
  - `/app-webview_cross_platform` PNPM, React Native WebView
  - `/web-mpa` PNPM, Next.js
  - `/web-spa` PNPM, Vite, React
- 참고
  - SDK 가이드 문서: [scripts/src/sdk/docs](https://github.com/OpenFormatKorea/scripts/tree/main/src/sdk/docs)
  - SDK 스니펫: [scripts/src/sdk/snippets](https://github.com/OpenFormatKorea/scripts/tree/main/src/sdk/snippets)

