'use client'

import { useActionState, useEffect } from 'react'
import { logout } from '../actions'

export default function LogoutButton() {
  const [state, formAction] = useActionState(logout, { redirectTo: null })

  // 하드 네비게이션(전체 리로드)으로 이동해 boot를 재실행시킵니다. 배경은 actions.ts 주석을 참고해주세요.
  useEffect(() => {
    if (state.redirectTo) window.location.assign(state.redirectTo)
  }, [state])

  return (
    <form action={formAction}>
      <button
        type="submit"
        style={{ padding: '8px 16px', fontSize: 16, backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
      >
        로그아웃
      </button>
    </form>
  )
}
