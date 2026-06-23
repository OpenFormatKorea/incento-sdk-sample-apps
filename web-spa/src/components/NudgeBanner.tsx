import Incento from '../incento.service'

export default function NudgeBanner() {
  return (
    <div
      onClick={() => Incento.open()}
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
