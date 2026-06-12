# incento-sdk-sample-apps

**Incento SDK를 독립몰(자체 앱·웹)에 연동하려는 고객사 개발자**를 위한 플랫폼별 코드 샘플입니다.

연동을 위한 가이드와 문서는 [인센토 개발자센터](https://developers.incento.kr)를 참고해주세요.

## 환경별 샘플 앱

| 환경 | 폴더 | 스택 | 
| --- | --- | --- | 
| 웹 (SPA) | [/web-spa](/web-spa) | Vite + React | 
| 웹 (MPA) | [/web-mpa](/web-mpa) | Next.js | 
| 웹앱 (WebView) | [/app-webview_cross_platform](/app-webview_cross_platform/) | 
| Android 네이티브 | [/app-native_android](/app-native_android/) | Kotlin, Jetpack Compose | 
| iOS 네이티브 | [/app-native_ios](/app-native_ios/) | Swift, SwiftUI | 

## 샘플 앱 공통 시나리오

3개 탭으로 구성: 홈 / 상품 목록 / 마이페이지

**로그인 전**
- 위젯은 '홈' 탭에서만 표출
- 위젯 버튼을 클릭해서 열린 위젯 내부에 위치한 [로그인] 버튼 클릭 시:
  - 위젯 자동 닫힘 → '마이페이지'로 이동 → '로그인 뷰' 표출
    - '마이페이지'에는 위젯 버튼 미표출
  - 로그인 완료 → '홈'으로 리다이렉트 → 위젯 자동 열림

**로그인 후**
- 위젯은 '홈', '마이페이지' 탭에서만 표출
- 로그인 여부에 따라 위젯 내부 표출 뷰가 달라짐 (링크 공유 버튼 등)

**로그아웃 후**
- 위젯은 '홈' 탭에서만 표출
- 로그인 여부에 따라 위젯 내부 표출 뷰가 달라짐 (로그인 버튼 등)