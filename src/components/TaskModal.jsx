import { useState, useEffect } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import { createTask, updateTask, getProfiles, createSubtask, toggleSubtask } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const PRIORITIES = ['urgente', 'alta', 'media', 'baja']
const STATUSES = ['pendiente', 'en_curso', 'revision', 'completada', 'cancelada']
const STATUS_LABELS = { pendiente: 'Pendiente', en_curso: 'En curso', revision: 'En revisión', completada: 'Completada', cancelada: 'Cancelada' }
const PRIORITY_LABELS = { urgente: 'Urgente', alta: 'Alta', media: 'Media', baja: 'Baja' }

export default function TaskModal({ task, onClose, onSaved }) {
  const { profile } = useAuth()
  const [profiles, setProfiles] = useState([])
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'pendiente',
    priority: task?.priority || 'media',
    progress: task?.progress || 0,
    assigned_to: task?.assigned_to || '',
    due_date: task?.due_date || '',
    tags: task?.tags?.join(', ') || '',
  })
  const [subtasks, setSubtasks] = useState(task?.subtasks || [])
  const [newSubtask, setNewSubtask] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getProfiles().then(({ data }) => setProfiles(data || []))
  }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (!form.title.trim()) return setError('El título es obligatorio')
    setLoading(true)
    setError('')
    const payload = {
      ...form,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      progress: Number(form.progress),
      assigned_to: form.assigned_to || null,
      due_date: form.due_date || null,
      created_by: profile?.id,
    }
    const { error: err } = task
      ? await updateTask(task.id, payload)
      : await createTask(payload)
    setLoading(false)
    if (err) return setError(err.message)
    onSaved()
    onClose()
  }

  const handleAddSubtask = async () => {
    if (!newSubtask.trim() || !task?.id) return
    const { data } = await createSubtask(task.id, newSubtask.trim())
    if (data) setSubtasks(s => [...s, data])
    setNewSubtask('')
  }

  const handleToggleSubtask = async (id, completed) => {
    await toggleSubtask(id, !completed)
    setSubtasks(s => s.map(st => st.id === id ? { ...st, completed: !completed } : st))
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">{task ? 'Editar tarea' : 'Nueva tarea'}</h2>
          <button className="btn btn-icon" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="modal-body">
          {error && <div style={{ color: 'var(--danger)', fontSize: 12, padding: '6px 10px', background: 'var(--danger-light)', borderRadius: 6 }}>{error}</div>}

          <div className="form-group">
            <label className="form-label">Título *</label>
            <input className="form-input" value={form.title} onChange={e => set('title', e.target.value)} placeholder="¿Qué hay que hacer?" />
          </div>

          <div className="form-group">
            <label className="form-label">Descripción</label>
            <textarea className="form-textarea" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Detalles, contexto, links..." />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Prioridad</label>
              <select className="form-select" value={form.priority} onChange={e => set('priority', e.target.value)}>
                {PRIORITIES.map(p => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Estado</label>
              <select className="form-select" value={form.status} onChange={e => set('status', e.target.value)}>
                {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Responsable</label>
              <select className="form-select" value={form.assigned_to} onChange={e => set('assigned_to', e.target.value)}>
                <option value="">Sin asignar</option>
                {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Fecha límite</label>
              <input type="date" className="form-input" value={form.due_date} onChange={e => set('due_date', e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Avance: {form.progress}%</label>
            <input type="range" min="0" max="100" step="5" value={form.progress}
              onChange={e => set('progress', e.target.value)}
              style={{ width: '100%', accentColor: 'var(--accent)' }} />
          </div>

          <div className="form-group">
            <label className="form-label">Etiquetas (separadas por coma)</label>
            <input className="form-input" value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="diseño, urgente, cliente" />
          </div>

          {task && (
            <div className="form-group">
              <label className="form-label">Subtareas</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {subtasks.map(st => (
                  <div key={st.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="checkbox" checked={st.completed} onChange={() => handleToggleSubtask(st.id, st.completed)}
                      style={{ accentColor: 'var(--accent)', width: 14, height: 14 }} />
                    <span style={{ fontSize: 13, textDecoration: st.completed ? 'line-through' : 'none', color: st.completed ? 'var(--text-3)' : 'var(--text)' }}>{st.title}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <input className="form-input" value={newSubtask} onChange={e => setNewSubtask(e.target.value)}
                    placeholder="Agregar subtarea..." onKeyDown={e => e.key === 'Enter' && handleAddSubtask()} />
                  <button className="btn btn-sm" onClick={handleAddSubtask}><Plus size={13} /></button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? <div className="spinner" style={{ width: 14, height: 14 }} /> : null}
            {task ? 'Guardar cambios' : 'Crear tarea'}
          </button>
        </div>
      </div>
    </div>
  )
}
