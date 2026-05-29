import LoginForm from './LoginForm'
import IncentoBoot from '../components/IncentoBoot'

interface Props {
  searchParams: Promise<{ returnUrl?: string }>
}

export default async function LoginPage({ searchParams }: Props) {
  const { returnUrl } = await searchParams

  return (
    <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 46px)' }}>
      <IncentoBoot visible={false} />
      <LoginForm returnUrl={returnUrl || '/'} />
    </div>
  )
}
