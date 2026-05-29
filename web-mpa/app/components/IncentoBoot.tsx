import Script from 'next/script'
import { cookies } from 'next/headers'

export default async function IncentoBoot({ visible = true }: { visible?: boolean }) {
  const cookieStore = await cookies()
  const userId = cookieStore.get('userId')?.value ?? null

  return (
    <Script
      id="incento-boot"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `Incento('boot', {
          apiKey: '${process.env.NEXT_PUBLIC_INCENTO_API_KEY}',
          ${userId ? `userId: '${userId}',` : ''}
          visible: ${visible},
          debug: true,
        });`
      }}
    />
  )
}
