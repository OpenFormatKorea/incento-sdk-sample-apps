import { useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router'
import { ProtectedRoute } from './components/ProtectedRoute'
import { useAuth } from './contexts/AuthContext'
import Incento from './incento.service'
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
    Incento.shutdown()

    Incento.boot({ 
      apiKey: 'inc_pk_live_9230dc93331a446b4b81362b613a9faa26740f70aa40fe8b541f5e0c9d2ae934', 
      userId: username, 
      visible: INCENTO_WIDGET_ALLOW_PAGES.includes(location.pathname), 
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
