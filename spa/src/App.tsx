import { useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router'
import { ProtectedRoute } from './components/ProtectedRoute'
import { useAuth } from './contexts/AuthContext'
import Incento from './incento.service'
import { Layout } from './Layout'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import ProductsPage from './pages/ProductsPage'
import MypagePage from './pages/MypagePage'

function App() {
  const navigate = useNavigate()
  const { username } = useAuth()

  useEffect(() => {
    Incento.loadScript()
    Incento.on('loginRequired', () => navigate('/login'))
  }, [])

  useEffect(() => {
    Incento.shutdown()
    Incento.boot({ apiKey: 'inc_pk_live_9230dc93331a446b4b81362b613a9faa26740f70aa40fe8b541f5e0c9d2ae934', userId: username, debug: true })
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
