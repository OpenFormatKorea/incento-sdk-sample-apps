import { NavLink } from 'react-router'
import { useAuth } from '../contexts/AuthContext'

export default function Nav() {
  const { username } = useAuth()

  return (
    <nav style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #ddd' }}>
      {[
        { to: '/', label: '홈' },
        { to: '/products', label: '상품 목록' },
        { to: '/mypage', label: '마이페이지' },
      ].map(({ to, label }) => (
        <NavLink
          key={to}
          to={to}
          end
          style={({ isActive }) => ({
            padding: '12px 20px',
            textDecoration: 'none',
            color: isActive ? '#000' : '#666',
            borderBottom: isActive ? '2px solid #000' : '2px solid transparent',
            fontWeight: isActive ? 'bold' : 'normal',
          })}
        >
          {label}
        </NavLink>
      ))}
      <span style={{ marginLeft: 'auto', padding: '12px 20px', color: '#666', fontSize: 14 }}>
        {username}
      </span>
    </nav>
  )
}
