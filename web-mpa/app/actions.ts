'use server'

import { cookies } from 'next/headers'

export type ActionState = { redirectTo: string | null }

// 주의: 이 코드는 "전통적 MPA(이동마다 전체 새로고침, 하드 네비게이션)"에서의 SDK 사용법을 재현하기 위한 샘플 코드입니다.
// 따라서 실제 MPA 앱에서는 필요하지 않은 코드(Server Action redirect() 대신 URL 반환 + 클라이언트의 window.location.assign)도 포함합니다.
//
// - 하드 네비게이션 / 전통적 MPA(이동 시 전체 새로고침): boot가 매 페이지마다 재실행되므로 추가 작업 불필요. https://developers.incento.kr/docs/sdk/web/mpa (MPA 연동 가이드) 참고
// - 소프트 네비게이션: https://developers.incento.kr/docs/sdk/web/spa (SPA 연동 가이드) 참고
export async function login(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const username = formData.get('username') as string
  const returnUrl = (formData.get('returnUrl') as string) || '/'

  if (!username) return { redirectTo: null }

  const cookieStore = await cookies()
  cookieStore.set('userId', username, { path: '/', httpOnly: true, sameSite: 'lax' })
  return { redirectTo: returnUrl }
}

export async function logout(): Promise<ActionState> {
  const cookieStore = await cookies()
  cookieStore.delete('userId')
  return { redirectTo: '/login' }
}
