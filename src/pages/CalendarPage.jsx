import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { getTasks } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import TaskModal from '../components/TaskModal'
import { format, parseISO, isToday, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek } from 'date-fns'
import { es } from 'date-fns/locale'

const PRIORITY_COLORS = { urgente: '#dc2626', alta: '#d97706', media: '#2563eb', baja: '#1d9e75' }
const COLOR_MAP = { purple: 'av-purple', teal: 'av-teal', coral: 'av-coral', blue: 'av-blue', pink: 'av-pink', amber: 'av-amber', green: 'av-green' }

export default function CalendarPage() {
  const { isAdmin, profile } = useAuth()
  const [current, setCurrent] = useState(new Date())
  const [tasks, setTasks] = useState([])
  const [selectedDay, setSelectedDay] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const { data } = await getTasks()
    setTasks(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const myTasks = isAdmin ? tasks : tasks.filter(t => t.assigned_to === profile?.id)

  const monthStart = startOfMonth(current)
  const monthEnd = endOfMonth(current)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: calStart, end: calEnd })

  const tasksByDate = {}
  myTasks.forEach(t => {
    if (t.due_date) {
      const key = t.due_date
      if (!tasksByDate[key]) tasksByDate[key] = []
      tasksByDate[key].push(t)
    }
  })

  const selectedTasks = selectedDay ? (tasksByDate[format(selectedDay, 'yyyy-MM-dd')] || []) : []

  return (
    <>
      <div className="topbar">
        <div className="topbar-title">Calendario</div>
        <button className="btn" onClick={() => setCurrent(new Date())}>Hoy</button>
        <button className="btn btn-icon" onClick={() => setCurrent(subMonths(current, 1))}><ChevronLeft size={15} /></button>
        <span style={{ fontSize: 14, fontWeight: 500, minWidth: 140, textAlign: 'center' }}>
          {format(current, 'MMMM yyyy', { locale: es }).replace(/^\w/, c => c.toUpperCase())}
        </span>
        <button className="btn btn-icon" onClick={() => setCurrent(addMonths(current, 1))}><ChevronRight size={15} /></button>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={14} /> Nueva tarea
          </button>
        )}
      </div>

      <div className="page-content" style={{ flexDirection: 'row', gap: 18, overflow: 'hidden', padding: '18px 22px' }}>
        {/* Calendar grid */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0, marginBottom: 0 }}>
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', padding: '8px 4px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
                {d}
              </div>
            ))}
          </div>
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridTemplateRows: `repeat(${days.length / 7}, 1fr)`, border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'var(--bg-surface)' }}>
            {days.map((day, i) => {
              const key = format(day, 'yyyy-MM-dd')
              const dayTasks = tasksByDate[key] || []
              const isCurrentMonth = day.getMonth() === current.getMonth()
              const today = isToday(day)
              const isSelected = selectedDay && format(day, 'yyyy-MM-dd') === format(selectedDay, 'yyyy-MM-dd')

              return (
                <div
                  key={i}
                  onClick={() => setSelectedDay(day)}
                  style={{
                    borderRight: (i + 1) % 7 === 0 ? 'none' : '1px solid var(--border)',
                    borderBottom: i >= days.length - 7 ? 'none' : '1px solid var(--border)',
                    padding: '6px 8px',
                    cursor: 'pointer',
                    background: isSelected ? 'var(--accent-light)' : today ? '#fafafa' : 'var(--bg-surface)',
                    transition: 'background .1s',
                    minHeight: 80,
                    overflow: 'hidden',
                  }}
                >
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: today ? 700 : 400,
                    background: today ? 'var(--accent)' : 'transparent',
                    color: today ? '#fff' : isCurrentMonth ? 'var(--text)' : 'var(--text-3)',
                    marginBottom: 4,
                  }}>
                    {day.getDate()}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {dayTasks.slice(0, 3).map(t => (
                      <div key={t.id} style={{
                        fontSize: 10, padding: '2px 5px', borderRadius: 4,
                        background: PRIORITY_COLORS[t.priority] + '20',
                        color: PRIORITY_COLORS[t.priority],
                        fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        borderLeft: `2px solid ${PRIORITY_COLORS[t.priority]}`,
                      }}>
                        {t.title}
                      </div>
                    ))}
                    {dayTasks.length > 3 && (
                      <div style={{ fontSize: 10, color: 'var(--text-3)', paddingLeft: 4 }}>+{dayTasks.length - 3} más</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Day detail panel */}
        <div style={{ width: 260, flexShrink: 0 }}>
          <div className="card" style={{ height: '100%', overflow: 'auto' }}>
            {selectedDay ? (
              <>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>
                  {format(selectedDay, "d 'de' MMMM", { locale: es })}
                </div>
                {selectedTasks.length === 0 ? (
                  <div className="empty-state" style={{ padding: 20 }}>
                    <div className="empty-icon">📅</div>
                    <div>Sin tareas este día</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {selectedTasks.map(t => (
                      <div key={t.id} style={{ padding: 10, background: 'var(--bg-hover)', borderRadius: 'var(--radius)', borderLeft: `3px solid ${PRIORITY_COLORS[t.priority]}` }}>
                        <div style={{ fontWeight: 500, fontSize: 12, marginBottom: 4 }}>{t.title}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className={`badge b-${t.status}`} style={{ fontSize: 10 }}>
                            {t.status === 'pendiente' ? 'Pendiente' : t.status === 'en_curso' ? 'En curso' : t.status === 'completada' ? 'Completada' : 'En revisión'}
                          </span>
                          <span style={{ fontSize: 10, color: 'var(--text-3)' }}>{t.progress}%</span>
                        </div>
                        {t.assigned && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6 }}>
                            <div className={`avatar sm ${COLOR_MAP[t.assigned.color] || 'av-purple'}`}>{t.assigned.avatar_initials}</div>
                            <span style={{ fontSize: 11, color: 'var(--text-2)' }}>{t.assigned.full_name}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="empty-state" style={{ padding: 20 }}>
                <div className="empty-icon">👆</div>
                <div>Selecciona un día para ver sus tareas</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showModal && <TaskModal onClose={() => setShowModal(false)} onSaved={load} />}
    </>
  )
}
