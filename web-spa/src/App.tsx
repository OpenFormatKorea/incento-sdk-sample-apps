import { useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router'
import { ProtectedRoute } from './components/ProtectedRoute'
import { useAuth } from './contexts/AuthContext'
import Incento from './incento.service'
import { getUserCreatedAt } from './mockUserDb'
import { Layout } from './Layout'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import ProductsPage from './pages/ProductsPage'
import MypagePage from './pages/MypagePage'
import { INCENTO_WIDGET_ALLOW_PAGES } from './constants'

function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const { username } = useAuth()

  useEffect(() => {
    Incento.loadScript()

    Incento.on('loginRequired', () => {
      navigate('/login?show_incento_popup=true')
    })
    Incento.on('widgetOpen', () => {
      console.log('위젯 열림');
    })
    Incento.on('widgetClose', () => {
      console.log('위젯 닫힘');
    })
  }, [])

  useEffect(() => {
    Incento.setPath(location.pathname)
  }, [location.pathname])

  useEffect(() => {
    Incento.shutdown()

    Incento.boot({
      apiKey: import.meta.env.VITE_INCENTO_API_KEY,
      userId: username,
      userCreatedAt: getUserCreatedAt(username),
      visible: INCENTO_WIDGET_ALLOW_PAGES.includes(location.pathname),
      pagePath: location.pathname,
      debug: true
    })
  }, [username])

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/mypage" element={<ProtectedRoute><MypagePage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
