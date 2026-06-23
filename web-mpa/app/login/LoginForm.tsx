'use client'

import { useActionState, useEffect } from 'react'
import { login } from '../actions'

export default function LoginForm({ returnUrl }: { returnUrl: string }) {
  const [state, formAction] = useActionState(login, { redirectTo: null })

  // 하드 네비게이션(전체 리로드)으로 이동해 boot를 재실행시킵니다. 배경은 actions.ts 주석을 참고해주세요.
  useEffect(() => {
    if (state.redirectTo) window.location.assign(state.redirectTo)
  }, [state])

  return (
    <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 280 }}>
      <h1 style={{ fontSize: 24, marginBottom: 8, textAlign: 'center' }}>SDK Test Apps - MPA</h1>
      <input type="hidden" name="returnUrl" value={returnUrl} />
      <input
        type="text"
        name="username"
        placeholder="아이디"
        required
        style={{ padding: '8px 12px', fontSize: 16, border: '1px solid #ccc', borderRadius: 4 }}
      />
      <input
        type="password"
        name="password"
        placeholder="비밀번호"
        required
        style={{ padding: '8px 12px', fontSize: 16, border: '1px solid #ccc', borderRadius: 4 }}
      />
      <button
        type="submit"
        style={{ padding: '10px', fontSize: 16, backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
      >
        로그인
      </button>
    </form>
  )
}
