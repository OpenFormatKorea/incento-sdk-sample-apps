'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const username = formData.get('username') as string
  const returnUrl = (formData.get('returnUrl') as string) || '/'

  if (!username) return

  const cookieStore = await cookies()
  cookieStore.set('userId', username, { path: '/', httpOnly: true, sameSite: 'lax' })
  redirect(returnUrl)
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete('userId')
  redirect('/login')
}
