import { logout } from '../actions'

export default function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        style={{ padding: '8px 16px', fontSize: 16, backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
      >
        로그아웃
      </button>
    </form>
  )
}
