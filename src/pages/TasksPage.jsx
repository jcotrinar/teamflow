import { useState, useEffect, useMemo } from 'react'
import { Plus, Search, Edit2, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import { getTasks, deleteTask, updateProgress, updateTask } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import TaskModal from '../components/TaskModal'
import { format, parseISO, isPast } from 'date-fns'

const COLOR_MAP = { purple: 'av-purple', teal: 'av-teal', coral: 'av-coral', blue: 'av-blue', pink: 'av-pink', amber: 'av-amber', green: 'av-green' }
const PRIORITY_LABELS = { urgente: 'Urgente', alta: 'Alta', media: 'Media', baja: 'Baja' }
const STATUS_LABELS = { pendiente: 'Pendiente', en_curso: 'En curso', revision: 'En revisión', completada: 'Completada', cancelada: 'Cancelada' }
const PRIORITY_ORDER = { urgente: 0, alta: 1, media: 2, baja: 3 }

export default function TasksPage() {
  const { isAdmin, profile } = useAuth()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortDir, setSortDir] = useState('desc')
  const [showModal, setShowModal] = useState(false)
  const [editTask, setEditTask] = useState(null)

  const load = async () => {
    setLoading(true)
    const { data } = await getTasks()
    setTasks(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    let list = isAdmin ? tasks : tasks.filter(t => t.assigned_to === profile?.id)
    if (search) list = list.filter(t => t.title.toLowerCase().includes(search.toLowerCase()))
    if (filterStatus) list = list.filter(t => t.status === filterStatus)
    if (filterPriority) list = list.filter(t => t.priority === filterPriority)
    list = [...list].sort((a, b) => {
      if (sortBy === 'priority') {
        const diff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
        return sortDir === 'asc' ? diff : -diff
      }
      if (sortBy === 'progress') return sortDir === 'asc' ? a.progress - b.progress : b.progress - a.progress
      if (sortBy === 'due_date') {
        if (!a.due_date) return 1; if (!b.due_date) return -1
        return sortDir === 'asc' ? a.due_date.localeCompare(b.due_date) : b.due_date.localeCompare(a.due_date)
      }
      return sortDir === 'asc' ? a.created_at.localeCompare(b.created_at) : b.created_at.localeCompare(a.created_at)
    })
    return list
  }, [tasks, search, filterStatus, filterPriority, sortBy, sortDir, isAdmin, profile])

  const toggleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(col); setSortDir('asc') }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta tarea?')) return
    await deleteTask(id)
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  const handleProgressChange = async (id, progress) => {
    await updateProgress(id, progress)
    setTasks(prev => prev.map(t => t.id === id ? { ...t, progress } : t))
  }

  const handleStatusChange = async (id, status) => {
    await updateTask(id, { status })
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t))
  }

  const SortIcon = ({ col }) => sortBy === col
    ? (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)
    : null

  return (
    <>
      <div className="topbar">
        <div className="topbar-title">Tareas</div>
        <div style={{ position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
          <input className="topbar-search" style={{ paddingLeft: 28 }} placeholder="Buscar tarea..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-select" style={{ width: 'auto', fontSize: 12 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">Todos los estados</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select className="form-select" style={{ width: 'auto', fontSize: 12 }} value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
          <option value="">Toda prioridad</option>
          {Object.entries(PRIORITY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => { setEditTask(null); setShowModal(true) }}>
            <Plus size={14} /> Nueva tarea
          </button>
        )}
      </div>

      <div className="page-content">
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">📋</div><div>No se encontraron tareas</div></div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('created_at')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>Tarea <SortIcon col="created_at" /></div>
                  </th>
                  <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('priority')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>Prioridad <SortIcon col="priority" /></div>
                  </th>
                  {isAdmin && <th>Responsable</th>}
                  <th>Estado</th>
                  <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('progress')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>Avance <SortIcon col="progress" /></div>
                  </th>
                  <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('due_date')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>Vence <SortIcon col="due_date" /></div>
                  </th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(task => {
                  const overdue = task.due_date && isPast(parseISO(task.due_date)) && task.status !== 'completada'
                  return (
                    <tr key={task.id}>
                      <td style={{ maxWidth: 220 }}>
                        <div style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</div>
                        {task.description && <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.description}</div>}
                        {task.tags?.length > 0 && (
                          <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                            {task.tags.map(tag => (
                              <span key={tag} style={{ fontSize: 10, padding: '1px 5px', background: 'var(--bg-hover)', borderRadius: 10, color: 'var(--text-3)' }}>{tag}</span>
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
                          ) : <span className="text-muted">—</span>}
                        </td>
                      )}
                      <td>
                        <select
                          className="form-select"
                          style={{ fontSize: 11, padding: '3px 6px', width: 'auto' }}
                          value={task.status}
                          onChange={e => handleStatusChange(task.id, e.target.value)}
                          disabled={!isAdmin && task.assigned_to !== profile?.id}
                        >
                          {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                      </td>
                      <td style={{ minWidth: 150 }}>
                        {/* Solo el colaborador asignado puede mover la barra. La administradora solo observa. */}
                        {(!isAdmin && task.assigned_to === profile?.id) ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <input 
                              type="range" 
                              min="0" 
                              max="100" 
                              step="5" 
                              value={task.progress}
                              onChange={e => handleProgressChange(task.id, Number(e.target.value))}
                              style={{ flex: 1, accentColor: 'var(--accent)' }} 
                            />
                            <span className="progress-text">{task.progress}%</span>
                          </div>
                        ) : (
                          /* Vista para Administradora o tareas ajenas: Barra estática de solo lectura */
                          <div className="progress-wrap">
                            <div className="progress-bar">
                              <div 
                                className="progress-fill" 
                                style={{ width: `${task.progress}%`, background: isAdmin ? 'var(--text-3)' : 'var(--accent)' }} 
                              />
                            </div>
                            <span className="progress-text">{task.progress}%</span>
                          </div>
                        )}
                      </td>
                      <td style={{ fontSize: 12, color: overdue ? 'var(--danger)' : 'var(--text-2)', fontWeight: overdue ? 600 : 400, whiteSpace: 'nowrap' }}>
                        {task.due_date ? format(parseISO(task.due_date), 'dd/MM/yyyy') : '—'}
                        {overdue && ' ⚠'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {(isAdmin || task.assigned_to === profile?.id) && (
                            <button className="btn btn-icon btn-sm" title="Editar" onClick={() => { setEditTask(task); setShowModal(true) }}>
                              <Edit2 size={13} />
                            </button>
                          )}
                          {isAdmin && (
                            <button className="btn btn-icon btn-sm" title="Eliminar" onClick={() => handleDelete(task.id)} style={{ color: 'var(--danger)' }}>
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && <TaskModal task={editTask} onClose={() => { setShowModal(false); setEditTask(null) }} onSaved={load} />}
    </>
  )
}
