import { useNavigate } from 'react-router'
import { useAuth } from '../contexts/AuthContext'
import Nav from '../components/Nav'
import NudgeBanner from '../components/NudgeBanner'

export default function MypagePage() {
  const { username, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div>
      <Nav />
      <div style={{ padding: 32 }}>
        <h1 style={{ marginBottom: 24 }}>마이페이지</h1>
        <p style={{ marginBottom: 16 }}>아이디: <strong>{username}</strong></p>
        <button
          onClick={handleLogout}
          style={{ padding: '8px 16px', fontSize: 16, backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
        >
          로그아웃
        </button>
        <NudgeBanner />
      </div>
    </div>
  )
}
