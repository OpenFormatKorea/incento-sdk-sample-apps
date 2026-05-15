import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import Nav from './components/Nav'
import './globals.css'

export const metadata: Metadata = {
  title: 'SDK Test Apps - MPA',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const userId = cookieStore.get('userId')?.value ?? null

  return (
    <html lang="ko">
      <body style={{ margin: 0, fontFamily: 'Arial, Helvetica, sans-serif' }}>
        <Nav username={userId} />
        {children}
      </body>
    </html>
  )
}
