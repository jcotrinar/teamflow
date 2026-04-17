import { useState, useEffect } from 'react'
import { Plus, Edit2, X, Check } from 'lucide-react'
import { getProfiles, updateProfile, supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const COLORS = ['purple', 'teal', 'coral', 'blue', 'pink', 'amber', 'green']
const COLOR_MAP = { purple: 'av-purple', teal: 'av-teal', coral: 'av-coral', blue: 'av-blue', pink: 'av-pink', amber: 'av-amber', green: 'av-green' }
const COLOR_LABELS = { purple: 'Morado', teal: 'Verde agua', coral: 'Coral', blue: 'Azul', pink: 'Rosa', amber: 'Ámbar', green: 'Verde' }

function InviteModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ email: '', full_name: '', password: '', role: 'colaborador', color: 'teal' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleCreate = async () => {
    if (!form.email || !form.full_name || !form.password) return setError('Todos los campos son obligatorios')
    if (form.password.length < 6) return setError('La contraseña debe tener mínimo 6 caracteres')
    setLoading(true); setError('')

    // Create user via Supabase Auth (requires service role or signUp)
    const { data, error: err } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.full_name } }
    })

    if (err) { setLoading(false); return setError(err.message) }

    if (data.user) {
      await updateProfile(data.user.id, {
        full_name: form.full_name,
        role: form.role,
        color: form.color,
        avatar_initials: form.full_name.substring(0, 2).toUpperCase()
      })
    }

    setLoading(false); setSuccess(true)
    setTimeout(() => { onSaved(); onClose() }, 1500)
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">Agregar colaborador</h2>
          <button className="btn btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          {error && <div style={{ color: 'var(--danger)', fontSize: 12, padding: '6px 10px', background: 'var(--danger-light)', borderRadius: 6 }}>{error}</div>}
          {success && <div style={{ color: 'var(--success)', fontSize: 12, padding: '6px 10px', background: 'var(--success-light)', borderRadius: 6 }}>✓ Usuario creado exitosamente</div>}

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Nombre completo *</label>
              <input className="form-input" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Ej: María García" />
            </div>
            <div className="form-group">
              <label className="form-label">Rol *</label>
              <select className="form-select" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                <option value="colaborador">Colaborador</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Correo electrónico *</label>
            <input className="form-input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="correo@ejemplo.com" />
          </div>

          <div className="form-group">
            <label className="form-label">Contraseña temporal *</label>
            <input className="form-input" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Mínimo 6 caracteres" />
          </div>

          <div className="form-group">
            <label className="form-label">Color de avatar</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {COLORS.map(c => (
                <div
                  key={c}
                  onClick={() => setForm(f => ({ ...f, color: c }))}
                  style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
                >
                  <div className={`avatar ${COLOR_MAP[c]}`} style={{ border: form.color === c ? '2px solid var(--accent)' : '2px solid transparent', cursor: 'pointer' }}>
                    {form.full_name ? form.full_name.substring(0, 2).toUpperCase() : 'AB'}
                  </div>
                  <span style={{ fontSize: 9, color: 'var(--text-3)' }}>{COLOR_LABELS[c]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleCreate} disabled={loading || success}>
            {loading ? <div className="spinner" style={{ width: 14, height: 14, borderColor: 'rgba(255,255,255,.3)', borderTopColor: '#fff' }} /> : <Plus size={14} />}
            Crear usuario
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CollaboratorsPage() {
  const { isAdmin } = useAuth()
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})

  const load = async () => {
    setLoading(true)
    const { data } = await getProfiles()
    setProfiles(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const startEdit = (p) => {
    setEditingId(p.id)
    setEditForm({ full_name: p.full_name, role: p.role, color: p.color })
  }

  const saveEdit = async (id) => {
    await updateProfile(id, {
      ...editForm,
      avatar_initials: editForm.full_name.substring(0, 2).toUpperCase()
    })
    setEditingId(null)
    load()
  }

  if (!isAdmin) return (
    <div className="page-content">
      <div className="empty-state"><div className="empty-icon">🔒</div><div>Solo la administradora puede ver esta sección</div></div>
    </div>
  )

  return (
    <>
      <div className="topbar">
        <div className="topbar-title">Colaboradores</div>
        <button className="btn btn-primary" onClick={() => setShowInvite(true)}>
          <Plus size={14} /> Agregar colaborador
        </button>
      </div>

      <div className="page-content">
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
          ) : profiles.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">👥</div><div>No hay colaboradores aún</div></div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Colaborador</th>
                  <th>Rol</th>
                  <th>Color</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map(p => (
                  <tr key={p.id}>
                    <td>
                      {editingId === p.id ? (
                        <input className="form-input" style={{ fontSize: 13 }} value={editForm.full_name} onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))} />
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className={`avatar ${COLOR_MAP[p.color] || 'av-purple'}`}>{p.avatar_initials || p.full_name?.substring(0, 2).toUpperCase()}</div>
                          <div>
                            <div style={{ fontWeight: 500, fontSize: 13 }}>{p.full_name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Miembro del equipo</div>
                          </div>
                        </div>
                      )}
                    </td>
                    <td>
                      {editingId === p.id ? (
                        <select className="form-select" style={{ fontSize: 12, width: 'auto' }} value={editForm.role} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}>
                          <option value="colaborador">Colaborador</option>
                          <option value="admin">Administrador</option>
                        </select>
                      ) : (
                        <span className={`badge b-${p.role}`}>{p.role === 'admin' ? 'Administrador' : 'Colaborador'}</span>
                      )}
                    </td>
                    <td>
                      {editingId === p.id ? (
                        <div style={{ display: 'flex', gap: 6 }}>
                          {COLORS.map(c => (
                            <div
                              key={c}
                              onClick={() => setEditForm(f => ({ ...f, color: c }))}
                              className={`avatar sm ${COLOR_MAP[c]}`}
                              style={{ cursor: 'pointer', border: editForm.color === c ? '2px solid var(--accent)' : '2px solid transparent' }}
                            >
                              {editForm.full_name?.substring(0, 2).toUpperCase() || 'AB'}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className={`avatar sm ${COLOR_MAP[p.color] || 'av-purple'}`}>{p.avatar_initials}</div>
                      )}
                    </td>
                    <td>
                      {editingId === p.id ? (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-sm" style={{ color: 'var(--success)' }} onClick={() => saveEdit(p.id)}><Check size={13} /></button>
                          <button className="btn btn-sm" onClick={() => setEditingId(null)}><X size={13} /></button>
                        </div>
                      ) : (
                        <button className="btn btn-icon btn-sm" onClick={() => startEdit(p)}><Edit2 size={13} /></button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Instrucciones para colaboradores</div>
          <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.7 }}>
            <p style={{ marginBottom: 8 }}>Para dar acceso a un nuevo colaborador:</p>
            <ol style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li>Haz clic en <strong>"Agregar colaborador"</strong> y llena sus datos</li>
              <li>Comparte el enlace de la aplicación y sus credenciales (correo + contraseña temporal)</li>
              <li>El colaborador podrá ver sus tareas, actualizar el progreso y enviar reportes diarios</li>
              <li>Solo tú (administradora) puedes crear tareas, asignarlas y revisar reportes</li>
            </ol>
          </div>
        </div>
      </div>

      {showInvite && <InviteModal onClose={() => setShowInvite(false)} onSaved={load} />}
    </>
  )
}
