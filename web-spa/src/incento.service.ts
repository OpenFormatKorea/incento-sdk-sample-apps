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
  userCreatedAt?: string | null;
  visible?: boolean;
  debug?: boolean;
}
type EventName = 'widgetOpen' | 'widgetClose' | 'loginRequired';

class IncentoService {
  loadScript() {
    (function(){var w=window;if(w.Incento&&!w.Incento.q){return;}var i:IIncento=function(...args: unknown[]){i.c?.(args);} as
IIncento;i.q=[];i.c=function(a){i.q?.push(a);};w.Incento=i;function
l(){if(w.IncentoInitialized){return;}w.IncentoInitialized=true;var s=document.createElement('script');s.type='text/javascript';s.async=true;s.src='https://s3.incento.kr/scripts/sdk/incento.min.js';var
x=document.getElementsByTagName('script')[0];if(x.parentNode){x.parentNode.insertBefore(s,x);}}if(document.readyState==='complete'
){l();}else{w.addEventListener('DOMContentLoaded',l);w.addEventListener('load',l);}})();
  }
  boot(config: BootConfig) { window.Incento?.('boot', config); }
  setPath(path: string) { window.Incento?.('setPath', path); }
  show() { window.Incento?.('show'); }
  hide() { window.Incento?.('hide'); }
  shutdown() { window.Incento?.('shutdown'); }
  on(eventName: EventName, handler: () => void) { window.Incento?.('on', eventName, handler); }
}

export default new IncentoService();
