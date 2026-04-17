import { useState, useEffect } from 'react'
import { X, Plus, ExternalLink } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { 
  getProfiles, 
  createTask, 
  updateTask, 
  createSubtask, 
  toggleSubtask 
} from '../lib/supabase'

const PRIORITIES     = ['urgente','alta','media','baja']
const STATUSES       = ['pendiente','en_curso','revision','completada','cancelada']
const STATUS_LABELS   = { pendiente:'Pendiente', en_curso:'En curso', revision:'En revisión', completada:'Completada', cancelada:'Cancelada' }
const PRIORITY_LABELS = { urgente:'Urgente', alta:'Alta', media:'Media', baja:'Baja' }

// ── COMPONENTES AUXILIARES (MOVIDOS FUERA) ──────────────────────

const Field = ({ label, children, hint }) => (
  <div className="form-group">
    <label className="form-label">
      {label}
      {hint && <span style={{color:'var(--text-3)', fontWeight:400, marginLeft:4}}>{hint}</span>}
    </label>
    {children}
  </div>
)

const Locked = ({ value }) => (
  <div style={{padding:'8px 12px', background:'var(--bg-hover)', borderRadius:'var(--radius-sm)', fontSize:13, color:'var(--text-2)', border:'1px solid var(--border)'}}>
    {value || <span style={{color:'var(--text-3)'}}>—</span>}
  </div>
)

// ── COMPONENTE PRINCIPAL ────────────────────────────────────────

export default function TaskModal({ task, onClose, onSaved }) {
  const { profile, isAdmin } = useAuth()
  const [profiles, setProfiles] = useState([])
  const isAssigned = task?.assigned_to === profile?.id
  const canEditAdminFields = isAdmin

  const [form, setForm] = useState({
    title:           task?.title||'',
    description:     task?.description||'',
    status:          task?.status||'pendiente',
    priority:        task?.priority||'media',
    progress:        task?.progress||0,
    assigned_to:     task?.assigned_to||'',
    due_date:        task?.due_date||'',
    tags:            task?.tags?.join(', ')||'',
    deliverable_url: task?.deliverable_url||'',
  })
  
  const [subtasks,   setSubtasks]   = useState(task?.subtasks||[])
  const [newSubtask, setNewSubtask] = useState('')
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')

  useEffect(() => { 
    getProfiles().then(({ data }) => setProfiles(data || [])) 
  }, [])

  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  const handleSubmit = async () => {
    if (!form.title.trim()) return setError('El título es obligatorio')
    setLoading(true); setError('')
    const payload = {
      ...form,
      tags: form.tags ? form.tags.split(',').map(t=>t.trim()).filter(Boolean) : [],
      progress: Number(form.progress),
      assigned_to: form.assigned_to||null,
      due_date:    form.due_date||null,
      created_by:  profile?.id,
    }
    const { error: err } = task 
      ? await updateTask(task.id, payload) 
      : await createTask(payload)
    
    setLoading(false)
    if (err) return setError(err.message)
    onSaved(); onClose()
  }

  const handleAddSubtask = async () => {
    if (!newSubtask.trim()||!task?.id) return
    const { data } = await createSubtask(task.id, newSubtask.trim())
    if (data) setSubtasks(s=>[...s,data])
    setNewSubtask('')
  }

  const handleToggleSubtask = async (id, completed) => {
    await toggleSubtask(id, !completed)
    setSubtasks(s=>s.map(st=>st.id===id?{...st,completed:!completed}:st))
  }

  // El renderizado de abajo se mantiene igual, pero ahora usará
  // los componentes Field y Locked declarados arriba.
  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        {/* ... (Todo el contenido del modal que ya tenías) ... */}
        <div className="modal-header">
          <h2 className="modal-title">{task?'Editar tarea':'Nueva tarea'}</h2>
          <button className="btn btn-icon" onClick={onClose}><X size={16}/></button>
        </div>

        <div className="modal-body">
          {error&&<div style={{color:'var(--danger)',fontSize:12,padding:'6px 10px',background:'var(--danger-light)',borderRadius:6}}>{error}</div>}

          {!canEditAdminFields&&(
            <div style={{fontSize:11,padding:'6px 10px',background:'var(--info-light)',color:'var(--info)',borderRadius:6}}>
              Solo puedes actualizar el avance, estado y el link de entregable.
            </div>
          )}

          <Field label="Título *">
            {canEditAdminFields
              ? <input className="form-input" value={form.title} onChange={e=>set('title',e.target.value)} placeholder="¿Qué hay que hacer?"/>
              : <Locked value={form.title}/>}
          </Field>

          <Field label="Descripción">
            {canEditAdminFields
              ? <textarea className="form-textarea" value={form.description} onChange={e=>set('description',e.target.value)} placeholder="Detalles, contexto, links..."/>
              : <Locked value={form.description}/>}
          </Field>

          <div className="form-row">
            <Field label="Prioridad">
              {canEditAdminFields
                ? <select className="form-select" value={form.priority} onChange={e=>set('priority',e.target.value)}>
                    {PRIORITIES.map(p=><option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
                  </select>
                : <Locked value={PRIORITY_LABELS[form.priority]}/>}
            </Field>

            <Field label="Estado">
              <select className="form-select" value={form.status} onChange={e=>set('status',e.target.value)}>
                {STATUSES.map(s=><option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </Field>
          </div>

          <div className="form-row">
            <Field label="Responsable">
              {canEditAdminFields
                ? <select className="form-select" value={form.assigned_to} onChange={e=>set('assigned_to',e.target.value)}>
                    <option value="">Sin asignar</option>
                    {profiles.map(p=><option key={p.id} value={p.id}>{p.full_name}</option>)}
                  </select>
                : <Locked value={profiles.find(p=>p.id===form.assigned_to)?.full_name}/>}
            </Field>

            <Field label="Fecha límite">
              {canEditAdminFields
                ? <input type="date" className="form-input" value={form.due_date} onChange={e=>set('due_date',e.target.value)}/>
                : <Locked value={form.due_date||'Sin fecha'}/>}
            </Field>
          </div>

          <Field label={`Avance: ${form.progress}%`}>
            {isAdmin ? (
                /* Si es admin, mostramos el progreso pero bloqueamos el input */
                <div style={{ padding: '10px 0' }}>
                  <div className="progress-bar" style={{ flex: 1 }}>
                    <div className="progress-fill" style={{ width: `${form.progress}%`, background: 'var(--text-3)' }} />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
                    Solo el colaborador asignado puede actualizar el progreso.
                  </div>
                </div>
              ) : (
                /* Si no es admin (es colaborador), puede mover el slider */
                <input
                  type="range" min="0" max="100" step="5"
                  value={form.progress} onChange={e => set('progress', e.target.value)}
                  style={{ width: '100%', accentColor: 'var(--accent)' }}
                />
              )}
            </Field>

          <Field label="Link de entregable" hint="(Drive, Docs, Sheets, etc.)">
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <input
                className="form-input"
                value={form.deliverable_url}
                onChange={e=>set('deliverable_url',e.target.value)}
                placeholder="https://drive.google.com/..."
                style={{flex:1}}
              />
              {form.deliverable_url&&(
                <a href={form.deliverable_url} target="_blank" rel="noreferrer" className="btn btn-sm" style={{flexShrink:0}}>
                  <ExternalLink size={13}/> Abrir
                </a>
              )}
            </div>
          </Field>

          {canEditAdminFields&&(
            <Field label="Etiquetas" hint="(separadas por coma)">
              <input className="form-input" value={form.tags} onChange={e=>set('tags',e.target.value)} placeholder="diseño, urgente, cliente"/>
            </Field>
          )}

          {task&&(
            <Field label="Subtareas">
              <div style={{display:'flex',flexDirection:'column',gap:6}}>
                {subtasks.map(st=>(
                  <div key={st.id} style={{display:'flex',alignItems:'center',gap:8}}>
                    <input type="checkbox" checked={st.completed} onChange={()=>handleToggleSubtask(st.id,st.completed)} style={{accentColor:'var(--accent)',width:14,height:14}}/>
                    <span style={{fontSize:13,textDecoration:st.completed?'line-through':'none',color:st.completed?'var(--text-3)':'var(--text)'}}>{st.title}</span>
                  </div>
                ))}
                {canEditAdminFields&&(
                  <div style={{display:'flex',gap:8,marginTop:4}}>
                    <input className="form-input" value={newSubtask} onChange={e=>setNewSubtask(e.target.value)} placeholder="Agregar subtarea..." onKeyDown={e=>e.key==='Enter'&&handleAddSubtask()}/>
                    <button className="btn btn-sm" onClick={handleAddSubtask}><Plus size={13}/></button>
                  </div>
                )}
              </div>
            </Field>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading&&<div className="spinner" style={{width:14,height:14,borderColor:'rgba(255,255,255,.3)',borderTopColor:'#fff'}}/>}
            {task?'Guardar cambios':'Crear tarea'}
          </button>
        </div>
      </div>
    </div>
  )
}