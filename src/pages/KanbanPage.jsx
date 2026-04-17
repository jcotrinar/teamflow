import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { getTasks, updateTask } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import TaskModal from '../components/TaskModal'
import { format, parseISO, isPast } from 'date-fns'

const COLUMNS = [
  { key: 'pendiente', label: 'Pendiente', color: '#9a9790' },
  { key: 'en_curso', label: 'En curso', color: '#2563eb' },
  { key: 'revision', label: 'En revisión', color: '#d97706' },
  { key: 'completada', label: 'Completada', color: '#1d9e75' },
  { key: 'cancelada', label: 'Cancelada', color: '#dc2626' },
]
const PRIORITY_LABELS = { urgente: 'Urgente', alta: 'Alta', media: 'Media', baja: 'Baja' }
const COLOR_MAP = { purple: 'av-purple', teal: 'av-teal', coral: 'av-coral', blue: 'av-blue', pink: 'av-pink', amber: 'av-amber', green: 'av-green' }

export default function KanbanPage() {
  const { isAdmin, profile } = useAuth()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [dragId, setDragId] = useState(null)

  const load = async () => {
    setLoading(true)
    const { data } = await getTasks()
    setTasks(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const myTasks = isAdmin ? tasks : tasks.filter(t => t.assigned_to === profile?.id)

  const handleDragStart = (e, id) => { setDragId(id); e.dataTransfer.effectAllowed = 'move' }
  const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }
  const handleDrop = async (e, status) => {
    e.preventDefault()
    if (!dragId) return
    await updateTask(dragId, { status })
    setTasks(prev => prev.map(t => t.id === dragId ? { ...t, status } : t))
    setDragId(null)
  }

  return (
    <>
      <div className="topbar">
        <div className="topbar-title">Tablero Kanban</div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={14} /> Nueva tarea
          </button>
        )}
      </div>

      <div style={{ flex: 1, overflow: 'hidden', padding: '18px 22px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}><div className="spinner" /></div>
        ) : (
          <div className="kanban-board" style={{ height: '100%' }}>
            {COLUMNS.map(col => {
              const colTasks = myTasks.filter(t => t.status === col.key)
              return (
                <div
                  key={col.key}
                  className="kanban-col"
                  onDragOver={handleDragOver}
                  onDrop={e => handleDrop(e, col.key)}
                  style={{ height: '100%', overflowY: 'auto' }}
                >
                  <div className="kanban-col-title">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }} />
                      {col.label}
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>{colTasks.length}</span>
                  </div>

                  {colTasks.length === 0 && (
                    <div style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center', padding: '20px 8px', borderRadius: 8, border: '1px dashed var(--border)' }}>
                      Arrastra aquí
                    </div>
                  )}

                  {colTasks.map(task => {
                    const overdue = task.due_date && isPast(parseISO(task.due_date)) && task.status !== 'completada'
                    return (
                      <div
                        key={task.id}
                        className="kanban-card"
                        draggable={isAdmin || task.assigned_to === profile?.id}
                        onDragStart={e => handleDragStart(e, task.id)}
                        style={{ opacity: dragId === task.id ? .5 : 1 }}
                      >
                        <div className="kanban-card-title">{task.title}</div>

                        {task.description && (
                          <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 8, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                            {task.description}
                          </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <span className={`badge b-${task.priority}`} style={{ fontSize: 10 }}>{PRIORITY_LABELS[task.priority]}</span>
                          {task.due_date && (
                            <span style={{ fontSize: 10, color: overdue ? 'var(--danger)' : 'var(--text-3)', fontWeight: overdue ? 600 : 400 }}>
                              {overdue ? '⚠ ' : ''}{format(parseISO(task.due_date), 'dd/MM')}
                            </span>
                          )}
                        </div>

                        <div style={{ marginBottom: 8 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-3)', marginBottom: 3 }}>
                            <span>Avance</span><span>{task.progress}%</span>
                          </div>
                          <div className="progress-bar" style={{ height: 3 }}>
                            <div className="progress-fill" style={{ width: `${task.progress}%` }} />
                          </div>
                        </div>

                        {task.assigned && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div className={`avatar sm ${COLOR_MAP[task.assigned.color] || 'av-purple'}`}>{task.assigned.avatar_initials}</div>
                            <span style={{ fontSize: 11, color: 'var(--text-2)' }}>{task.assigned.full_name}</span>
                          </div>
                        )}

                        {task.tags?.length > 0 && (
                          <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
                            {task.tags.map(tag => (
                              <span key={tag} style={{ fontSize: 10, padding: '1px 5px', background: 'var(--bg-hover)', borderRadius: 10, color: 'var(--text-3)' }}>{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showModal && <TaskModal onClose={() => setShowModal(false)} onSaved={load} />}
    </>
  )
}
