import type { Metadata } from 'next'
import Script from 'next/script'
import { cookies } from 'next/headers'
import Nav from './components/Nav'
import './globals.css'

export const metadata: Metadata = {
  title: 'SDK Test Apps - MPA',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const userId = cookieStore.get('userId')?.value ?? null

  return (
    <html lang="ko">
      <body style={{ margin: 0, fontFamily: 'Arial, Helvetica, sans-serif' }}>
        <Script
          id="incento-snippet"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){var w=window;if(w.Incento&&!w.Incento.q){return;}var i=function(){i.c(arguments);};i.q=[];i.c=function(a){i.q.push(a);};w.Incento=i;function l(){if(w.IncentoInitialized){return;}w.IncentoInitialized=true;var s=document.createElement('script');s.type='text/javascript';s.async=true;s.src='https://s3.incento.kr/scripts/sdk/incento.min.js';var x=document.getElementsByTagName('script')[0];if(x.parentNode){x.parentNode.insertBefore(s,x);}}if(document.readyState==='complete'){l();}else{w.addEventListener('DOMContentLoaded',l);w.addEventListener('load',l);}})();`,
          }}
        />
        <Script
          id="incento-hooks"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              Incento('on', 'loginRequired', function() {
                var returnUrl = window.location.href + (window.location.search ? '&' : '?') + 'incento_popup=true';
                window.location.href = '/login?show_incento_popup=true&returnUrl=' + encodeURIComponent(returnUrl);
              });
              Incento('on', 'widgetOpen', function() {
                console.log('위젯이 열렸습니다');
              });
              Incento('on', 'widgetClose', function() {
                console.log('위젯이 닫혔습니다');
              });
            `
          }}
        />
        <Nav username={userId} />
        {children}
      </body>
    </html>
  )
}
