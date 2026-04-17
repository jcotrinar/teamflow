import { useState, useEffect } from 'react'
import { Plus, AlertCircle, CheckCircle2, Clock, TrendingUp } from 'lucide-react'
import { getTasks, getReports, getUserTaskSummary } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import TaskModal from '../components/TaskModal'
import { format, isToday, isPast, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

const COLOR_MAP = { purple: 'av-purple', teal: 'av-teal', coral: 'av-coral', blue: 'av-blue', pink: 'av-pink', amber: 'av-amber', green: 'av-green' }
const PRIORITY_LABELS = { urgente: 'Urgente', alta: 'Alta', media: 'Media', baja: 'Baja' }
const STATUS_LABELS = { pendiente: 'Pendiente', en_curso: 'En curso', revision: 'En revisión', completada: 'Completada', cancelada: 'Cancelada' }
const MOODS = ['', '😞', '😕', '😐', '🙂', '😄']

function ProgressBar({ value, color }) {
  return (
    <div className="progress-wrap">
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${value}%`, background: color || 'var(--accent)' }} />
      </div>
      <span className="progress-text">{value}%</span>
    </div>
  )
}

export default function DashboardPage() {
  const { isAdmin, profile } = useAuth()
  const [tasks, setTasks] = useState([])
  const [reports, setReports] = useState([])
  const [summary, setSummary] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const [{ data: t }, { data: r }, { data: s }] = await Promise.all([
      getTasks(), getReports(format(new Date(), 'yyyy-MM-dd')), getUserTaskSummary()
    ])
    setTasks(t || [])
    setReports(r || [])
    setSummary(s || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const myTasks = isAdmin ? tasks : tasks.filter(t => t.assigned_to === profile?.id)
  const total = myTasks.length
  const inProgress = myTasks.filter(t => t.status === 'en_curso').length
  const completed = myTasks.filter(t => t.status === 'completada').length
  const dueToday = myTasks.filter(t => t.due_date && (isToday(parseISO(t.due_date)) || isPast(parseISO(t.due_date))) && t.status !== 'completada').length

  const now = new Date()
  const days = []
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  const startPad = (firstDay.getDay() + 6) % 7
  for (let i = 0; i < startPad; i++) {
    const d = new Date(firstDay); d.setDate(d.getDate() - startPad + i)
    days.push({ date: d, other: true })
  }
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  for (let i = 1; i <= daysInMonth; i++) days.push({ date: new Date(now.getFullYear(), now.getMonth(), i), other: false })
  while (days.length % 7 !== 0) {
    const last = days[days.length - 1].date
    const next = new Date(last); next.setDate(last.getDate() + 1)
    days.push({ date: next, other: true })
  }

  const taskDates = new Set(tasks.filter(t => t.due_date).map(t => t.due_date))

  return (
    <>
      <div className="topbar">
        <div className="topbar-title">
          Dashboard — {format(new Date(), 'MMMM yyyy', { locale: es }).replace(/^\w/, c => c.toUpperCase())}
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={14} /> Nueva tarea
          </button>
        )}
      </div>

      <div className="page-content">
        {/* Metrics */}
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-label">Tareas totales</div>
            <div className="metric-value">{total}</div>
            <div className="metric-sub">{isAdmin ? 'En todo el equipo' : 'Asignadas a mí'}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">En curso</div>
            <div className="metric-value" style={{ color: 'var(--accent)' }}>{inProgress}</div>
            <div className="metric-sub">Actualmente activas</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Completadas</div>
            <div className="metric-value" style={{ color: 'var(--success)' }}>{completed}</div>
            <div className="metric-sub">{total > 0 ? Math.round(completed / total * 100) : 0}% del total</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Vencen pronto</div>
            <div className="metric-value" style={{ color: dueToday > 0 ? 'var(--danger)' : 'var(--text)' }}>{dueToday}</div>
            <div className="metric-sub">{dueToday > 0 ? 'Requieren atención' : 'Todo al día'}</div>
          </div>
        </div>

        {/* Tasks table */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <span style={{ fontSize: 13, fontWeight: 600 }}>Tareas activas</span>
            <span className="text-muted">{myTasks.filter(t => t.status !== 'completada' && t.status !== 'cancelada').length} pendientes</span>
          </div>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}><div className="spinner" /></div>
          ) : myTasks.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">📋</div><div>No hay tareas aún</div></div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tarea</th>
                  <th>Prioridad</th>
                  {isAdmin && <th>Responsable</th>}
                  <th>Estado</th>
                  <th>Avance</th>
                  <th>Vence</th>
                </tr>
              </thead>
              <tbody>
                {myTasks.slice(0, 8).map(task => {
                  const overdue = task.due_date && isPast(parseISO(task.due_date)) && task.status !== 'completada'
                  return (
                    <tr key={task.id}>
                      <td style={{ fontWeight: 500, maxWidth: 200 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</div>
                        {task.tags?.length > 0 && (
                          <div style={{ display: 'flex', gap: 4, marginTop: 3, flexWrap: 'wrap' }}>
                            {task.tags.map(tag => (
                              <span key={tag} style={{ fontSize: 10, padding: '1px 6px', background: 'var(--bg-hover)', borderRadius: 10, color: 'var(--text-3)' }}>{tag}</span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td><span className={`badge b-${task.priority}`}>{PRIORITY_LABELS[task.priority]}</span></td>
                      {isAdmin && (
                        <td>
                          {task.assigned ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div className={`avatar sm ${COLOR_MAP[task.assigned.color] || 'av-purple'}`}>{task.assigned.avatar_initials}</div>
                              <span style={{ fontSize: 12 }}>{task.assigned.full_name}</span>
                            </div>
                          ) : <span className="text-muted">Sin asignar</span>}
                        </td>
                      )}
                      <td><span className={`badge b-${task.status}`}>{STATUS_LABELS[task.status]}</span></td>
                      <td style={{ minWidth: 140 }}><ProgressBar value={task.progress} /></td>
                      <td style={{ fontSize: 12, color: overdue ? 'var(--danger)' : 'var(--text-2)', fontWeight: overdue ? 600 : 400 }}>
                        {task.due_date ? format(parseISO(task.due_date), 'dd/MM') : '—'}
                        {overdue && ' ⚠'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          {/* Collaborator workload - admin only */}
          {isAdmin && (
            <div className="card">
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Carga por colaborador</div>
              {summary.filter(s => s.role === 'colaborador').length === 0 ? (
                <div className="empty-state" style={{ padding: 20 }}><div>Sin colaboradores aún</div></div>
              ) : (
                summary.filter(s => s.role === 'colaborador').map(u => {
                  const pct = u.total_tasks > 0 ? Math.round(u.completed / u.total_tasks * 100) : 0
                  const load = u.in_progress >= 4 ? 'alta' : u.in_progress >= 2 ? 'media' : 'baja'
                  return (
                    <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                      <div className={`avatar ${COLOR_MAP[u.color] || 'av-purple'}`}>{u.full_name?.substring(0,2).toUpperCase()}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <span style={{ fontSize: 12, fontWeight: 500 }}>{u.full_name}</span>
                          <span className={`badge b-${load === 'alta' ? 'urgente' : load === 'media' ? 'media' : 'baja'}`} style={{ fontSize: 10 }}>
                            {load === 'alta' ? 'Carga alta' : load === 'media' ? 'Media' : 'Libre'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div className="progress-bar" style={{ flex: 1 }}>
                            <div className="progress-fill" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-muted">{u.total_tasks} tareas</span>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}

          {/* Mini calendar */}
          <div className="card">
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
              {format(new Date(), 'MMMM yyyy', { locale: es }).replace(/^\w/, c => c.toUpperCase())}
            </div>
            <div className="cal-grid">
              {['Lu','Ma','Mi','Ju','Vi','Sá','Do'].map(d => (
                <div key={d} className="cal-header">{d}</div>
              ))}
              {days.map(({ date, other }, i) => {
                const dateStr = format(date, 'yyyy-MM-dd')
                const hasTask = taskDates.has(dateStr)
                const today = isToday(date)
                return (
                  <div key={i} className={`cal-day ${today ? 'today' : hasTask ? 'has-tasks' : ''} ${other ? 'other-month' : ''}`}>
                    {date.getDate()}
                    {hasTask && !today && <div className="cal-dot" />}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Daily reports panel - admin sees today's team reports */}
          {isAdmin && (
            <div className="card" style={{ gridColumn: '1 / -1' }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>
                Reportes del día — {format(new Date(), 'dd/MM/yyyy')}
              </div>
              {reports.length === 0 ? (
                <div className="empty-state" style={{ padding: 20 }}>
                  <div className="empty-icon">📝</div>
                  <div>Ningún colaborador ha enviado reporte hoy</div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                  {reports.map(r => (
                    <div key={r.id} className="report-card">
                      <div className="report-card-header">
                        <div className={`avatar ${COLOR_MAP[r.author?.color] || 'av-purple'}`}>{r.author?.avatar_initials}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 500, fontSize: 13 }}>{r.author?.full_name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{format(new Date(), 'HH:mm')} · {MOODS[r.mood] || ''}</div>
                        </div>
                        <span className={`badge b-${r.status === 'aprobado' ? 'aprobado' : r.status === 'requiere_atencion' ? 'urgente' : 'pendiente-r'}`}>
                          {r.status === 'aprobado' ? 'Aprobado' : r.status === 'requiere_atencion' ? 'Atención' : 'Pendiente'}
                        </span>
                      </div>
                      <div>
                        <div className="report-section-label">Qué hice</div>
                        <div className="report-section-text" style={{ fontSize: 12 }}>{r.what_i_did}</div>
                      </div>
                      <div>
                        <div className="report-section-label">Qué logré</div>
                        <div className="report-section-text" style={{ fontSize: 12 }}>{r.what_i_achieved}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showModal && <TaskModal onClose={() => setShowModal(false)} onSaved={load} />}
    </>
  )
}
