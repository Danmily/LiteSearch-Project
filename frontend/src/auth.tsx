import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

const API_BASE = 'http://localhost:8000'
const TOKEN_KEY = 'huayuji-auth-token'

interface AuthUser {
  email: string
  nickname: string
}

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  loading: boolean
  error: string | null
  register: (email: string, password: string, nickname: string) => Promise<boolean>
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  clearError: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function parseErrorDetail(res: Response): Promise<string> {
  try {
    const data = await res.json()
    return data.detail ?? `请求失败: ${res.status}`
  } catch {
    return `请求失败: ${res.status}`
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function loadMe() {
      if (!token) {
        setLoading(false)
        return
      }
      try {
        const res = await fetch(new URL('/auth/me', API_BASE), {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error()
        const data = await res.json()
        if (!cancelled) setUser({ email: data.email, nickname: data.nickname })
      } catch {
        if (!cancelled) {
          setToken(null)
          localStorage.removeItem(TOKEN_KEY)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadMe()
    return () => {
      cancelled = true
    }
  }, [token])

  const register = useCallback(async (email: string, password: string, nickname: string) => {
    setError(null)
    try {
      const res = await fetch(new URL('/auth/register', API_BASE), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, nickname }),
      })
      if (!res.ok) throw new Error(await parseErrorDetail(res))
      const data = await res.json()
      setUser({ email: data.email, nickname: data.nickname })
      setToken(data.token)
      localStorage.setItem(TOKEN_KEY, data.token)
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误')
      return false
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    setError(null)
    try {
      const res = await fetch(new URL('/auth/login', API_BASE), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) throw new Error(await parseErrorDetail(res))
      const data = await res.json()
      setUser({ email: data.email, nickname: data.nickname })
      setToken(data.token)
      localStorage.setItem(TOKEN_KEY, data.token)
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误')
      return false
    }
  }, [])

  const logout = useCallback(() => {
    const t = token
    setUser(null)
    setToken(null)
    localStorage.removeItem(TOKEN_KEY)
    if (t) {
      fetch(new URL('/auth/logout', API_BASE), {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}` },
      }).catch(() => {})
    }
  }, [token])

  const clearError = useCallback(() => setError(null), [])

  return (
    <AuthContext.Provider value={{ user, token, loading, error, register, login, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function authHeader(token: string | null): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {}
}
