import { useState, useEffect } from 'react'
import { getTasks, getUserTaskSummary, getReports } from '../lib/supabase'
import { format, subDays, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

const COLOR_MAP = { purple: 'av-purple', teal: 'av-teal', coral: 'av-coral', blue: 'av-blue', pink: 'av-pink', amber: 'av-amber', green: 'av-green' }
const BAR_COLORS = ['#533ab7', '#1d9e75', '#d97706', '#dc2626', '#2563eb', '#d85a30']

function MiniBar({ value, max, color }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div style={{ flex: 1, height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width .4s ease' }} />
    </div>
  )
}

function DonutChart({ data, size = 120 }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total === 0) return <div style={{ width: size, height: size, borderRadius: '50%', background: 'var(--border)' }} />
  let cumulative = 0
  const radius = 40
  const cx = size / 2, cy = size / 2
  const slices = data.map((d, i) => {
    const pct = d.value / total
    const start = cumulative
    cumulative += pct
    const startAngle = start * 2 * Math.PI - Math.PI / 2
    const endAngle = cumulative * 2 * Math.PI - Math.PI / 2
    const x1 = cx + radius * Math.cos(startAngle)
    const y1 = cy + radius * Math.sin(startAngle)
    const x2 = cx + radius * Math.cos(endAngle)
    const y2 = cy + radius * Math.sin(endAngle)
    const largeArc = pct > 0.5 ? 1 : 0
    return { ...d, path: `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`, color: BAR_COLORS[i] }
  })

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {slices.map((s, i) => <path key={i} d={s.path} fill={s.color} opacity={.85} />)}
      <circle cx={cx} cy={cy} r={radius * 0.55} fill="var(--bg-surface)" />
      <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 14, fontWeight: 700, fill: 'var(--text)', fontFamily: 'var(--mono)' }}>{total}</text>
    </svg>
  )
}

export default function AnalyticsPage() {
  const [tasks, setTasks] = useState([])
  const [summary, setSummary] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getTasks(), getUserTaskSummary()]).then(([{ data: t }, { data: s }]) => {
      setTasks(t || [])
      setSummary(s || [])
      setLoading(false)
    })
  }, [])

  const byStatus = [
    { label: 'Pendiente', value: tasks.filter(t => t.status === 'pendiente').length },
    { label: 'En curso', value: tasks.filter(t => t.status === 'en_curso').length },
    { label: 'En revisión', value: tasks.filter(t => t.status === 'revision').length },
    { label: 'Completada', value: tasks.filter(t => t.status === 'completada').length },
    { label: 'Cancelada', value: tasks.filter(t => t.status === 'cancelada').length },
  ].filter(d => d.value > 0)

  const byPriority = [
    { label: 'Urgente', value: tasks.filter(t => t.priority === 'urgente').length },
    { label: 'Alta', value: tasks.filter(t => t.priority === 'alta').length },
    { label: 'Media', value: tasks.filter(t => t.priority === 'media').length },
    { label: 'Baja', value: tasks.filter(t => t.priority === 'baja').length },
  ].filter(d => d.value > 0)

  const completionRate = tasks.length > 0 ? Math.round(tasks.filter(t => t.status === 'completada').length / tasks.length * 100) : 0
  const avgProgress = tasks.length > 0 ? Math.round(tasks.reduce((s, t) => s + t.progress, 0) / tasks.length) : 0
  const overdueCount = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completada').length

  const maxTasks = Math.max(...summary.map(s => Number(s.total_tasks) || 0), 1)

  return (
    <>
      <div className="topbar">
        <div className="topbar-title">Analíticas</div>
      </div>

      <div className="page-content">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}><div className="spinner" /></div>
        ) : (
          <>
            {/* KPIs */}
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-label">Tasa de completado</div>
                <div className="metric-value" style={{ color: completionRate >= 50 ? 'var(--success)' : 'var(--warning)' }}>{completionRate}%</div>
                <div className="metric-sub">Del total de tareas</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Progreso promedio</div>
                <div className="metric-value" style={{ color: 'var(--accent)' }}>{avgProgress}%</div>
                <div className="metric-sub">En todas las tareas activas</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Tareas vencidas</div>
                <div className="metric-value" style={{ color: overdueCount > 0 ? 'var(--danger)' : 'var(--success)' }}>{overdueCount}</div>
                <div className="metric-sub">{overdueCount > 0 ? 'Requieren atención' : '¡Todo al día!'}</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Total tareas</div>
                <div className="metric-value">{tasks.length}</div>
                <div className="metric-sub">{summary.filter(s => s.role === 'colaborador').length} colaboradores</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
              {/* By status */}
              <div className="card">
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16 }}>Tareas por estado</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                  <DonutChart data={byStatus} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {byStatus.map((d, i) => (
                      <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 2, background: BAR_COLORS[i], flexShrink: 0 }} />
                        <span style={{ fontSize: 12, flex: 1, color: 'var(--text-2)' }}>{d.label}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, fontFamily: 'var(--mono)' }}>{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* By priority */}
              <div className="card">
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16 }}>Tareas por prioridad</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                  <DonutChart data={byPriority} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {byPriority.map((d, i) => (
                      <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 2, background: BAR_COLORS[i], flexShrink: 0 }} />
                        <span style={{ fontSize: 12, flex: 1, color: 'var(--text-2)' }}>{d.label}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, fontFamily: 'var(--mono)' }}>{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Per collaborator */}
            <div className="card">
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16 }}>Rendimiento por colaborador</div>
              {summary.length === 0 ? (
                <div className="empty-state" style={{ padding: 20 }}><div>Sin datos aún</div></div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {summary.map((u, i) => {
                    const total = Number(u.total_tasks) || 0
                    const completed = Number(u.completed) || 0
                    const inProgress = Number(u.in_progress) || 0
                    const avgProg = Number(u.avg_progress) || 0
                    const rate = total > 0 ? Math.round(completed / total * 100) : 0
                    return (
                      <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 14px', background: 'var(--bg-hover)', borderRadius: 'var(--radius)' }}>
                        <div className={`avatar lg ${COLOR_MAP[u.color] || 'av-purple'}`}>
                          {u.full_name?.substring(0, 2).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <span style={{ fontWeight: 500, fontSize: 13 }}>{u.full_name}</span>
                            <span className={`badge b-${u.role === 'admin' ? 'admin' : 'colaborador'}`} style={{ fontSize: 10 }}>{u.role === 'admin' ? 'Admin' : 'Colaborador'}</span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                            {[
                              { label: 'Total', value: total, color: 'var(--text)' },
                              { label: 'En curso', value: inProgress, color: 'var(--accent)' },
                              { label: 'Completadas', value: completed, color: 'var(--success)' },
                              { label: 'Completado', value: `${rate}%`, color: rate >= 50 ? 'var(--success)' : 'var(--warning)' },
                            ].map(stat => (
                              <div key={stat.label} style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 16, fontWeight: 700, color: stat.color, fontFamily: 'var(--mono)' }}>{stat.value}</div>
                                <div style={{ fontSize: 10, color: 'var(--text-3)' }}>{stat.label}</div>
                              </div>
                            ))}
                          </div>
                          <div style={{ marginTop: 8 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-3)', marginBottom: 3 }}>
                              <span>Progreso promedio</span><span>{avgProg}%</span>
                            </div>
                            <MiniBar value={avgProg} max={100} color={BAR_COLORS[i % BAR_COLORS.length]} />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Recent completed */}
            <div className="card">
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Últimas tareas completadas</div>
              {tasks.filter(t => t.status === 'completada').length === 0 ? (
                <div className="empty-state" style={{ padding: 16 }}><div>Aún no hay tareas completadas</div></div>
              ) : (
                <table className="data-table">
                  <thead><tr><th>Tarea</th><th>Responsable</th><th>Prioridad</th></tr></thead>
                  <tbody>
                    {tasks.filter(t => t.status === 'completada').slice(0, 8).map(t => (
                      <tr key={t.id}>
                        <td style={{ fontWeight: 500 }}>{t.title}</td>
                        <td>
                          {t.assigned ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div className={`avatar sm ${COLOR_MAP[t.assigned.color] || 'av-purple'}`}>{t.assigned.avatar_initials}</div>
                              <span style={{ fontSize: 12 }}>{t.assigned.full_name}</span>
                            </div>
                          ) : <span className="text-muted">—</span>}
                        </td>
                        <td><span className={`badge b-${t.priority}`} style={{ fontSize: 10 }}>{t.priority}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </>
  )
}
