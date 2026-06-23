'use client'

declare global {
  interface Window {
    Incento?: (...args: unknown[]) => void
  }
}

// 마이페이지 넛징 배너: 클릭 시 명령형 API(open)로 위젯을 연다. eventType 'E'로 집계된다.
// page.tsx는 서버 컴포넌트라 클릭 핸들러를 붙일 수 없어 클라이언트 컴포넌트로 분리한다.
export default function NudgeBanner() {
  return (
    <div
      onClick={() => window.Incento?.('open')}
      style={{
        height: 160,
        marginTop: 24,
        border: '1px solid #000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        cursor: 'pointer',
      }}
    >
      마이페이지 넛징 배너 / 친구 초대 시 3,000원 즉시 지급!
    </div>
  )
}
