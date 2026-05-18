import { cookies } from 'next/headers'
import LogoutButton from './LogoutButton'
import IncentoBoot from '../components/IncentoBoot'

export default async function MypagePage() {
  const cookieStore = await cookies()
  const userId = cookieStore.get('userId')?.value ?? null

  return (
    <div style={{ padding: 32 }}>
      <IncentoBoot />
      <h1 style={{ marginBottom: 24 }}>마이페이지</h1>
      <p style={{ marginBottom: 16 }}>아이디: <strong>{userId}</strong></p>
      <LogoutButton />
    </div>
  )
}
