import { useState, useEffect } from 'react'
import { CheckCircle2, AlertCircle, Clock, Send } from 'lucide-react'
import { getReports, getMyReports, upsertReport, reviewReport } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const MOODS = [
  { value: 1, emoji: '😞', label: 'Muy mal' },
  { value: 2, emoji: '😕', label: 'Mal' },
  { value: 3, emoji: '😐', label: 'Regular' },
  { value: 4, emoji: '🙂', label: 'Bien' },
  { value: 5, emoji: '😄', label: 'Excelente' },
]

const COLOR_MAP = { purple: 'av-purple', teal: 'av-teal', coral: 'av-coral', blue: 'av-blue', pink: 'av-pink', amber: 'av-amber', green: 'av-green' }

function CollaboratorForm({ profile, onSaved }) {
  const today = format(new Date(), 'yyyy-MM-dd')
  const [form, setForm] = useState({ what_i_did: '', what_i_achieved: '', blockers: '', mood: 4 })
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [myReports, setMyReports] = useState([])

  useEffect(() => {
    getMyReports(profile.id).then(({ data }) => {
      setMyReports(data || [])
      const todayReport = data?.find(r => r.report_date === today)
      if (todayReport) { setForm({ what_i_did: todayReport.what_i_did, what_i_achieved: todayReport.what_i_achieved, blockers: todayReport.blockers || '', mood: todayReport.mood || 4 }); setSaved(true) }
    })
  }, [])

  const handleSubmit = async () => {
    if (!form.what_i_did.trim() || !form.what_i_achieved.trim()) return alert('Completa los campos obligatorios')
    setLoading(true)
    await upsertReport({ ...form, user_id: profile.id, report_date: today })
    setLoading(false); setSaved(true)
    getMyReports(profile.id).then(({ data }) => setMyReports(data || []))
    onSaved?.()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div className="card">
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
          Reporte de hoy — {format(new Date(), "EEEE d 'de' MMMM", { locale: es }).replace(/^\w/, c => c.toUpperCase())}
          {saved && <span className="badge b-aprobado" style={{ marginLeft: 10 }}>Enviado</span>}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">¿Qué hice hoy? *</label>
            <textarea className="form-textarea" rows={3} value={form.what_i_did} onChange={e => setForm(f => ({ ...f, what_i_did: e.target.value }))} placeholder="Describe las actividades que realizaste..." />
          </div>
          <div className="form-group">
            <label className="form-label">¿Qué logré hoy? *</label>
            <textarea className="form-textarea" rows={3} value={form.what_i_achieved} onChange={e => setForm(f => ({ ...f, what_i_achieved: e.target.value }))} placeholder="¿Cuál fue el resultado o avance más importante?" />
          </div>
          <div className="form-group">
            <label className="form-label">¿Tuve bloqueos o dificultades?</label>
            <textarea className="form-textarea" rows={2} value={form.blockers} onChange={e => setForm(f => ({ ...f, blockers: e.target.value }))} placeholder="(Opcional) ¿Algo que impidió avanzar?" />
          </div>
          <div className="form-group">
            <label className="form-label">¿Cómo te sientes hoy?</label>
            <div className="mood-picker">
              {MOODS.map(m => (
                <button key={m.value} className={`mood-btn ${form.mood === m.value ? 'selected' : ''}`} title={m.label} onClick={() => setForm(f => ({ ...f, mood: m.value }))}>
                  {m.emoji}
                </button>
              ))}
            </div>
          </div>

          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading} style={{ alignSelf: 'flex-end' }}>
            {loading ? <div className="spinner" style={{ width: 14, height: 14, borderColor: 'rgba(255,255,255,.3)', borderTopColor: '#fff' }} /> : <Send size={14} />}
            {saved ? 'Actualizar reporte' : 'Enviar reporte'}
          </button>
        </div>
      </div>

      {/* My history */}
      {myReports.length > 0 && (
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Mis reportes anteriores</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {myReports.slice(0, 5).map(r => (
              <div key={r.id} style={{ padding: 12, background: 'var(--bg-hover)', borderRadius: 'var(--radius)', borderLeft: `3px solid ${r.status === 'aprobado' ? 'var(--success)' : r.status === 'requiere_atencion' ? 'var(--danger)' : 'var(--border-2)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 500 }}>{format(new Date(r.report_date + 'T12:00:00'), "EEEE d/MM", { locale: es }).replace(/^\w/, c => c.toUpperCase())}</span>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {r.mood && <span style={{ fontSize: 16 }}>{MOODS.find(m => m.value === r.mood)?.emoji}</span>}
                    <span className={`badge b-${r.status === 'aprobado' ? 'aprobado' : r.status === 'requiere_atencion' ? 'urgente' : 'pendiente-r'}`} style={{ fontSize: 10 }}>
                      {r.status === 'aprobado' ? 'Aprobado' : r.status === 'requiere_atencion' ? 'Requiere atención' : 'Pendiente'}
                    </span>
                  </div>
                </div>
                <div className="report-section-label">Logré</div>
                <div className="report-section-text" style={{ fontSize: 12 }}>{r.what_i_achieved}</div>
                {r.admin_note && (
                  <div style={{ marginTop: 8, padding: '6px 10px', background: 'var(--accent-light)', borderRadius: 6 }}>
                    <div style={{ fontSize: 10, color: 'var(--accent-text)', fontWeight: 600 }}>Nota de la administradora:</div>
                    <div style={{ fontSize: 12, color: 'var(--accent-text)' }}>{r.admin_note}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function AdminView() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [reviewing, setReviewing] = useState(null)
  const [adminNote, setAdminNote] = useState('')

  const load = async () => {
    setLoading(true)
    const { data } = await getReports(selectedDate)
    setReports(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [selectedDate])

  const handleReview = async (id, status) => {
    await reviewReport(id, status, adminNote)
    setReviewing(null)
    setAdminNote('')
    load()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Reportes del equipo</div>
          <input type="date" className="form-input" style={{ width: 160, fontSize: 12 }} value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 30 }}><div className="spinner" /></div>
        ) : reports.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">📝</div><div>Sin reportes para esta fecha</div></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {reports.map(r => (
              <div key={r.id} className="report-card" style={{ borderLeft: `3px solid ${r.status === 'aprobado' ? 'var(--success)' : r.status === 'requiere_atencion' ? 'var(--danger)' : 'var(--border-2)'}` }}>
                <div className="report-card-header">
                  <div className={`avatar ${COLOR_MAP[r.author?.color] || 'av-purple'}`}>{r.author?.avatar_initials}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{r.author?.full_name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                      {MOODS.find(m => m.value === r.mood)?.emoji} {MOODS.find(m => m.value === r.mood)?.label}
                    </div>
                  </div>
                  <span className={`badge b-${r.status === 'aprobado' ? 'aprobado' : r.status === 'requiere_atencion' ? 'urgente' : 'pendiente-r'}`}>
                    {r.status === 'aprobado' ? '✓ Aprobado' : r.status === 'requiere_atencion' ? '⚠ Atención' : 'Pendiente'}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <div className="report-section-label">Qué hice</div>
                    <div className="report-section-text" style={{ fontSize: 12 }}>{r.what_i_did}</div>
                  </div>
                  <div>
                    <div className="report-section-label">Qué logré</div>
                    <div className="report-section-text" style={{ fontSize: 12 }}>{r.what_i_achieved}</div>
                  </div>
                </div>

                {r.blockers && (
                  <div style={{ padding: '8px 12px', background: 'var(--warning-light)', borderRadius: 6 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--warning)', marginBottom: 2 }}>Bloqueos reportados</div>
                    <div style={{ fontSize: 12 }}>{r.blockers}</div>
                  </div>
                )}

                {r.admin_note && (
                  <div style={{ padding: '8px 12px', background: 'var(--accent-light)', borderRadius: 6 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent-text)', marginBottom: 2 }}>Tu nota</div>
                    <div style={{ fontSize: 12, color: 'var(--accent-text)' }}>{r.admin_note}</div>
                  </div>
                )}

                {reviewing === r.id ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <textarea className="form-textarea" rows={2} value={adminNote} onChange={e => setAdminNote(e.target.value)} placeholder="Nota para el colaborador (opcional)..." />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-sm" style={{ color: 'var(--success)', borderColor: 'var(--success)' }} onClick={() => handleReview(r.id, 'aprobado')}>
                        <CheckCircle2 size={13} /> Aprobar
                      </button>
                      <button className="btn btn-sm" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={() => handleReview(r.id, 'requiere_atencion')}>
                        <AlertCircle size={13} /> Requiere atención
                      </button>
                      <button className="btn btn-sm" onClick={() => setReviewing(null)}>Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <button className="btn btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => { setReviewing(r.id); setAdminNote(r.admin_note || '') }}>
                    Revisar y comentar
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function ReportsPage() {
  const { isAdmin, profile } = useAuth()

  return (
    <>
      <div className="topbar">
        <div className="topbar-title">{isAdmin ? 'Reportes del equipo' : 'Mi reporte diario'}</div>
      </div>
      <div className="page-content">
        {isAdmin ? <AdminView /> : <CollaboratorForm profile={profile} />}
      </div>
    </>
  )
}
