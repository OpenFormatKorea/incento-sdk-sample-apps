  목적
  - Incento JS SDK의 SPA 환경 동작을 검증하기 위한 테스트용 앱

  기술 스택
  - Vite + React + TypeScript + React Router
  
  화면 구성 (4개)
  - /login — 아이디/비밀번호 입력 폼 + 로그인 버튼 (아이디, 비밀번호 입력 후 버튼 클릭 시 /home으로 이동)
  - / — 홈 화면 ('홈' 텍스트)
  - /products — 제품 목록 ('제품 목록' 텍스트, 더미 카드 3~5개)
  - /mypage — 마이페이지 ('마이페이지' 텍스트, 유저 아이디 정보 + 로그아웃 버튼)

  인증 상태 관리
  - 로그인/로그아웃 상태를 React Context로 관리 (로컬 상태만, 서버 연동 없음. isLoggedIn, username)
  - 비로그인 상태에서 /, /products, /mypage 접근 시 /login으로 리다이렉트
  - 로그아웃은 /mypage의 로그아웃 버튼으로 처리 → /login으로 이동

  Incento SDK 연동
  - src/incento.service.ts 파일 생성 (아래 스니펫 그대로 사용)
  - App.tsx 최상단에서 Incento.loadScript() 한 번 호출
  - loginRequired 이벤트 등록: 위젯 내 로그인 버튼 클릭 시 /login으로 이동
  - 인증 상태(userId) 변경 시: shutdown() → boot() 재호출
  - 라우트 변경 시: /mypage에서만 show(), 나머지 페이지에서는 hide()
  - apiKey는 inc_pk_test로 하드코딩, debug: true 설정

  // src/incento.service.ts — 그대로 붙여넣기
  declare global {
    interface Window {
      Incento?: IIncento;
      IncentoInitialized?: boolean;
    }
  }
  interface IIncento {
    c?: (args: any) => void;
    q?: unknown[][];
    (...args: unknown[]): void;
  }
  interface BootConfig {
    apiKey: string;
    userId?: string | null;
    debug?: boolean;
  }
  type EventName = 'widgetOpen' | 'widgetClose' | 'loginRequired';

  class IncentoService {
    loadScript() {
      (function(){var w=window;if(w.Incento&&!w.Incento.q){return;}var i:IIncento=function(...args: unknown[]){i.c?.(args);} as
  IIncento;i.q=[];i.c=function(a){i.q?.push(a);};w.Incento=i;function 
  l(){if(w.IncentoInitialized){return;}w.IncentoInitialized=true;var s=document.createElement('script');s.type='text/javascript';s.a
  sync=true;s.src='https://s3.incento.kr/scripts/sdk/incento.min.js';var
  x=document.getElementsByTagName('script')[0];if(x.parentNode){x.parentNode.insertBefore(s,x);}}if(document.readyState==='complete'
  ){l();}else{w.addEventListener('DOMContentLoaded',l);w.addEventListener('load',l);}})();
    }
    boot(config: BootConfig) { window.Incento?.('boot', config); }
    show() { window.Incento?.('show'); }
    hide() { window.Incento?.('hide'); }
    shutdown() { window.Incento?.('shutdown'); }
    on(eventName: EventName, handler: () => void) { window.Incento?.('on', eventName, handler); }
  }

  export default new IncentoService();

  기타
  - 스타일은 최소한으로 (CSS 모듈 또는 인라인), UI 라이브러리 사용 금지
  - 더미 데이터는 파일 내 하드코딩