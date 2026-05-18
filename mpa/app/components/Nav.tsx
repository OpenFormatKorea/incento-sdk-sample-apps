'use client'

import { usePathname } from 'next/navigation'

const NAV_LINKS = [
  { href: '/', label: '홈' },
  { href: '/products', label: '상품 목록' },
  { href: '/mypage', label: '마이페이지' },
]

export default function Nav({ username }: { username?: string | null }) {
  const pathname = usePathname()

  return (
    <nav style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #ddd' }}>
      {NAV_LINKS.map(({ href, label }) => {
        const isActive = pathname === href
        return (
          <a
            key={href}
            href={href}
            style={{
              padding: '12px 20px',
              textDecoration: 'none',
              color: isActive ? '#000' : '#666',
              borderBottom: isActive ? '2px solid #000' : '2px solid transparent',
              fontWeight: isActive ? 'bold' : 'normal',
            }}
          >
            {label}
          </a>
        )
      })}
      {username && (
        <span style={{ marginLeft: 'auto', padding: '12px 20px', color: '#666', fontSize: 14 }}>
          {username}
        </span>
      )}
    </nav>
  )
}
