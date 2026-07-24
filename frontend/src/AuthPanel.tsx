import { useState, type FormEvent } from 'react'
import { useAuth } from './auth'

export default function AuthPanel() {
  const { user, loading, error, register, login, logout, clearError } = useAuth()
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    const ok = mode === 'login' ? await login(email, password) : await register(email, password, nickname)
    setBusy(false)
    if (ok) {
      setOpen(false)
      setEmail('')
      setPassword('')
      setNickname('')
    }
  }

  if (loading) return null

  if (user) {
    return (
      <div className="auth-widget">
        <span className="hint">已登录:{user.nickname}</span>
        <button type="button" className="ink-btn ghost" onClick={logout}>退出登录</button>
      </div>
    )
  }

  return (
    <div className="auth-widget">
      {!open ? (
        <button type="button" className="ink-btn ghost" onClick={() => setOpen(true)}>登录 / 注册</button>
      ) : (
        <form className="note auth-note" onSubmit={submit}>
          <div className="theme-bar">
            <button type="button" className={mode === 'login' ? 'theme-chip on' : 'theme-chip'} onClick={() => { setMode('login'); clearError() }}>登录</button>
            <button type="button" className={mode === 'register' ? 'theme-chip on' : 'theme-chip'} onClick={() => { setMode('register'); clearError() }}>注册</button>
          </div>
          <div className="publish-fields">
            <input
              type="email"
              className="publish-input"
              placeholder="邮箱"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              className="publish-input"
              placeholder="密码(至少8位)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
            {mode === 'register' && (
              <input
                type="text"
                className="publish-input"
                placeholder="昵称"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={24}
                required
              />
            )}
            <button type="submit" className="ink-btn" disabled={busy}>
              {busy ? '处理中…' : mode === 'login' ? '登录' : '注册'}
            </button>
            <button type="button" className="ink-btn ghost" onClick={() => { setOpen(false); clearError() }}>取消</button>
          </div>
          {error && <p className="error">{error}</p>}
        </form>
      )}
    </div>
  )
}
