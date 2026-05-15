/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react'

interface AuthContextValue {
  isLoggedIn: boolean
  username: string | null
  login: (username: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [username, setUsername] = useState<string | null>(null)

  const login = (username: string) => {
    setIsLoggedIn(true)
    setUsername(username)
  }

  const logout = () => {
    setIsLoggedIn(false)
    setUsername(null)
  }

  return (
    <AuthContext.Provider value={{ isLoggedIn, username, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
