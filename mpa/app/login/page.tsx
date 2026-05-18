import LoginForm from './LoginForm'

interface Props {
  searchParams: Promise<{ returnUrl?: string }>
}

export default async function LoginPage({ searchParams }: Props) {
  const { returnUrl } = await searchParams

  return (
    <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 46px)' }}>
      <LoginForm returnUrl={returnUrl || '/'} />
    </div>
  )
}
