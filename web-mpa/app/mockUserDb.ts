// 독립몰 자체 회원 DB를 시뮬레이션합니다.
// 실제 서비스에서는 고객사 백엔드/세션에서 회원의 원래 가입 일시를 읽어와 boot에 전달합니다.
const SIGNUP_DATES: Record<string, string> = {
  // SDK 설치 이전부터 존재하던 기존 회원 (예시 A: 2년 전 가입) — 기회원 판별용
  member_001: '2023-03-15T09:30:00+09:00',
}

// 회원의 원래 가입 일시(ISO 8601)를 반환합니다.
// 알려진 기존 회원이면 가입 일시를, 신규 회원이면 null을 반환합니다.
// (null이면 서버가 현재 시각을 가입 일시로 처리 — 예시 B: 신규 회원)
export function getUserCreatedAt(userId: string | null): string | null {
  if (!userId) return null
  return SIGNUP_DATES[userId] ?? null
}
