import { cookies } from 'next/headers'
import LogoutButton from './LogoutButton'
import NudgeBanner from './NudgeBanner'
import IncentoBoot from '../components/IncentoBoot'

export default async function MypagePage() {
  const cookieStore = await cookies()
  const userId = cookieStore.get('userId')?.value ?? null

  return (
    <div>
      <IncentoBoot />
      <div style={{ padding: 32 }}>
        <h1 style={{ marginBottom: 24 }}>마이페이지</h1>
        <p style={{ marginBottom: 16 }}>아이디: <strong>{userId}</strong></p>
        <LogoutButton />
        <NudgeBanner />
      </div>
    </div>
  )
}
