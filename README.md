# sdk-test-apps

- 배경
  - 인센토는 플랫폼(cafe24, makeshop) 의존적 서비스로 출발함
  - 비즈니스 확장을 위해 독립몰 지원이 가능하도록 SDK를 개발함
- 목적
  - 실제 개발 환경에서 SDK를 테스트하기 위해 이 레포에 각 환경별 샘플 앱을 구성함
- 환경별 앱 구성
  - `/app-native_android` Kotlin, Jetpack Compose
  - `/app-native_ios` Swift, SwiftUI
  - `/app-webview_cross_platform` PNPM, React Native WebView
  - `/web-mpa` PNPM, Next.js
  - `/web-spa` PNPM, Vite, React
- SDK 참고
  - SDK 가이드 문서: [scripts/src/sdk/docs](https://github.com/OpenFormatKorea/scripts/tree/main/src/sdk/docs)
  - SDK 스니펫: [scripts/src/sdk/snippets](https://github.com/OpenFormatKorea/scripts/tree/main/src/sdk/snippets)

## 앱 시나리오

3개 탭으로 구성: 홈 / 상품 목록 / 마이페이지

**로그인 전**
- 위젯 표출 탭: 홈
- 위젯에서 로그인 버튼 클릭 시:
  - 위젯 자동 닫힘 → 마이페이지로 이동
  - 마이페이지에는 위젯 버튼 미표출
  - 로그인 완료 후 위젯 자동 열림

**로그인 후**
- 위젯 표출 탭: 홈, 마이페이지
- 위젯에서 링크 공유 버튼 표출

**로그아웃 후**
- 위젯 표출 탭: 홈
- 위젯에서 로그인 버튼 표출