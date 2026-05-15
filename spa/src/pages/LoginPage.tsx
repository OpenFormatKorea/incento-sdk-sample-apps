import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router'
import { useAuth } from '../contexts/AuthContext'
import Nav from '../components/Nav'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !password) return

    login(username)
    
    const params = new URLSearchParams(location.search)
    navigate(params.has('show_incento_popup') ? '/?incento_popup=true' : '/')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Nav />
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 280 }}>
        <h1 style={{ fontSize: 24, marginBottom: 8, textAlign: 'center' }}>SDK Test Apps - SPA</h1>
        <input
          type="text"
          placeholder="아이디"
          value={username}
          onChange={e => setUsername(e.target.value)}
          style={{ padding: '8px 12px', fontSize: 16, border: '1px solid #ccc', borderRadius: 4 }}
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{ padding: '8px 12px', fontSize: 16, border: '1px solid #ccc', borderRadius: 4 }}
        />
        <button
          type="submit"
          style={{ padding: '10px', fontSize: 16, backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
        >
          로그인
        </button>
      </form>
      </div>
    </div>
  )
}
