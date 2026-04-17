import { useState } from 'react'
import { signIn } from '../lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error: err } = await signIn(email, password)
    setLoading(false)
    if (err) setError('Correo o contraseña incorrectos')
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">TeamFlow</div>
        <div className="login-sub">Inicia sesión para continuar</div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {error && (
            <div style={{ fontSize: 12, color: 'var(--danger)', background: 'var(--danger-light)', padding: '8px 12px', borderRadius: 6 }}>
              {error}
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Correo electrónico</label>
            <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="nombre@empresa.com" required />
          </div>
          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          <button className="btn btn-primary w-full" type="submit" disabled={loading} style={{ marginTop: 4, justifyContent: 'center' }}>
            {loading ? <div className="spinner" style={{ width: 14, height: 14, borderColor: 'rgba(255,255,255,.3)', borderTopColor: '#fff' }} /> : 'Ingresar'}
          </button>
        </form>

        <p style={{ marginTop: 20, fontSize: 11, color: 'var(--text-3)', textAlign: 'center' }}>
          Si no tienes acceso, contacta a la administradora del sistema.
        </p>
      </div>
    </div>
  )
}
