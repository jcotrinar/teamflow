import { useState, useEffect } from 'react'
import { Plus, ExternalLink } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getTasks, getReports, getUserTaskSummary } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import TaskModal from '../components/TaskModal'
import { format, isToday, isPast, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

const COLOR_MAP = { purple:'av-purple', teal:'av-teal', coral:'av-coral', blue:'av-blue', pink:'av-pink', amber:'av-amber', green:'av-green' }
const PRIORITY_LABELS = { urgente:'Urgente', alta:'Alta', media:'Media', baja:'Baja' }
const STATUS_LABELS   = { pendiente:'Pendiente', en_curso:'En curso', revision:'En revisión', completada:'Completada', cancelada:'Cancelada' }
const MOODS = ['','😞','😕','😐','🙂','😄']

export default function DashboardPage() {
  const { isAdmin, profile } = useAuth()
  const navigate = useNavigate()
  const [tasks,   setTasks]   = useState([])
  const [reports, setReports] = useState([])
  const [summary, setSummary] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    // Cambiamos mockGetTasks -> getTasks, etc.
    const [{ data: t }, { data: r }, { data: s }] = await Promise.all([
      getTasks(), 
      getReports(format(new Date(), 'yyyy-MM-dd')), 
      getUserTaskSummary()
    ])
    setTasks(t || [])
    setReports(r || [])
    setSummary(s || [])
    setLoading(false)
  }
  useEffect(()=>{ load() },[])

  const myTasks = isAdmin ? tasks : tasks.filter(t=> t.assigned_to===profile?.id || t.assignees?.some(a=>a.profile.id===profile?.id))
  const total      = myTasks.length
  const inProgress = myTasks.filter(t=>t.status==='en_curso').length
  const completed  = myTasks.filter(t=>t.status==='completada').length
  const dueToday   = myTasks.filter(t=>t.due_date&&(isToday(parseISO(t.due_date))||isPast(parseISO(t.due_date)))&&t.status!=='completada').length

  // Mini-calendar days
  const now = new Date()
  const days = []
  const firstDay = new Date(now.getFullYear(),now.getMonth(),1)
  const startPad = (firstDay.getDay()+6)%7
  for(let i=0;i<startPad;i++){const d=new Date(firstDay);d.setDate(d.getDate()-startPad+i);days.push({date:d,other:true})}
  const daysInMonth = new Date(now.getFullYear(),now.getMonth()+1,0).getDate()
  for(let i=1;i<=daysInMonth;i++) days.push({date:new Date(now.getFullYear(),now.getMonth(),i),other:false})
  while(days.length%7!==0){const last=days[days.length-1].date;const next=new Date(last);next.setDate(last.getDate()+1);days.push({date:next,other:true})}
  const taskDates = new Set(tasks.filter(t=>t.due_date).map(t=>t.due_date))

  return (
    <>
      <div className="topbar">
        <div className="topbar-title">Dashboard — {format(new Date(),'MMMM yyyy',{locale:es}).replace(/^\w/,c=>c.toUpperCase())}</div>
        {isAdmin&&<button className="btn btn-primary" onClick={()=>setShowModal(true)}><Plus size={14}/> Nueva tarea</button>}
      </div>

      <div className="page-content">
        {/* Metrics */}
        <div className="metrics-grid">
          {[
            { label:'Tareas totales',  value:total,      sub:isAdmin?'En todo el equipo':'Asignadas a mí', color:null },
            { label:'En curso',        value:inProgress, sub:'Actualmente activas',                        color:'var(--accent)' },
            { label:'Completadas',     value:completed,  sub:`${total>0?Math.round(completed/total*100):0}% del total`, color:'var(--success)' },
            { label:'Vencen pronto',   value:dueToday,   sub:dueToday>0?'Requieren atención':'Todo al día', color:dueToday>0?'var(--danger)':null },
          ].map(m=>(
            <div key={m.label} className="metric-card">
              <div className="metric-label">{m.label}</div>
              <div className="metric-value" style={m.color?{color:m.color}:{}}>{m.value}</div>
              <div className="metric-sub">{m.sub}</div>
            </div>
          ))}
        </div>

        {/* Tasks table */}
        <div className="card">
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
            <span style={{fontSize:13,fontWeight:600}}>Tareas activas</span>
            <button
              className="btn btn-sm"
              onClick={()=>navigate('/tasks')}
              style={{fontSize:11,color:'var(--accent)',borderColor:'var(--accent-light)',background:'var(--accent-light)'}}
            >
              Ver todas →
            </button>
          </div>
          {loading
            ? <div style={{display:'flex',justifyContent:'center',padding:24}}><div className="spinner"/></div>
            : myTasks.length===0
              ? <div className="empty-state"><div className="empty-icon">📋</div><div>No hay tareas aún</div></div>
              : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Tarea</th>
                      <th>Prioridad</th>
                      {isAdmin&&<th>Responsable</th>}
                      <th>Estado</th>
                      <th>Avance</th>
                      <th>Vence</th>
                      <th>Entregable</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myTasks.slice(0,8).map(task=>{
                      const overdue = task.due_date&&isPast(parseISO(task.due_date))&&task.status!=='completada'
                      return (
                        <tr key={task.id}>
                          <td style={{fontWeight:500,maxWidth:180}}>
                            <div style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{task.title}</div>
                            {task.tags?.length>0&&<div style={{display:'flex',gap:4,marginTop:3,flexWrap:'wrap'}}>{task.tags.map(tag=><span key={tag} style={{fontSize:10,padding:'1px 6px',background:'var(--bg-hover)',borderRadius:10,color:'var(--text-3)'}}>{tag}</span>)}</div>}
                          </td>
                          <td><span className={`badge b-${task.priority}`}>{PRIORITY_LABELS[task.priority]}</span></td>
                          {isAdmin&&<td>
                            {task.assignees?.length > 0 ? (
                              <div style={{display:'flex',alignItems:'center'}}>
                                {task.assignees.slice(0,3).map((a,i) => (
                                  <div
                                    key={a.profile.id}
                                    className={`avatar sm av-${a.profile.color}`}
                                    title={a.profile.full_name}
                                    style={{marginLeft: i===0?0:-8, border:'2px solid var(--bg-surface)', zIndex:3-i}}
                                  >
                                    {a.profile.avatar_initials}
                                  </div>
                                ))}
                                {task.assignees.length > 3 && (
                                  <span style={{fontSize:11,color:'var(--text-3)',marginLeft:4}}>+{task.assignees.length-3}</span>
                                )}
                              </div>
                            ) : (
                              <span style={{color:'var(--text-3)',fontSize:12}}>Sin asignar</span>
                            )}
                          </td>}
                          <td><span className={`badge b-${task.status}`}>{STATUS_LABELS[task.status]}</span></td>
                          <td style={{minWidth:130}}>
                            <div className="progress-wrap">
                              <div className="progress-bar"><div className="progress-fill" style={{width:`${task.progress}%`}}/></div>
                              <span className="progress-text">{task.progress}%</span>
                            </div>
                          </td>
                          <td style={{fontSize:12,color:overdue?'var(--danger)':'var(--text-2)',fontWeight:overdue?600:400,whiteSpace:'nowrap'}}>
                            {task.due_date?format(parseISO(task.due_date),'dd/MM'):'—'}{overdue&&' ⚠'}
                          </td>
                          <td>
                            {task.deliverable_url
                              ? <a href={task.deliverable_url} target="_blank" rel="noreferrer" style={{display:'inline-flex',alignItems:'center',gap:4,fontSize:11,color:'var(--accent)',fontWeight:500,textDecoration:'none'}}>
                                  <ExternalLink size={11}/> Ver
                                </a>
                              : <span style={{fontSize:11,color:'var(--text-3)'}}>—</span>}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )
          }
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:18}}>
          {/* Collaborator workload */}
          {isAdmin&&(
            <div className="card">
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
                <span style={{fontSize:13,fontWeight:600}}>Carga por colaborador</span>
                <span style={{fontSize:10,color:'var(--text-3)'}}>tareas activas = pendiente + en curso + revisión</span>
              </div>
              {summary.filter(s=>s.role==='colaborador').length===0
                ? <div className="empty-state" style={{padding:20}}><div>Sin colaboradores aún</div></div>
                : summary.filter(s=>s.role==='colaborador').map(u=>{
                    const active = Number(u.active_tasks)||0
                    const total  = Number(u.total_tasks)||0
                    const pct    = total>0?Math.round((Number(u.completed)||0)/total*100):0
                    // Carga basada en tareas activas
                    const loadLevel = active>=4?'alta':active>=2?'media':'baja'
                    const loadColor = loadLevel==='alta'?'var(--danger)':loadLevel==='media'?'var(--warning)':'var(--success)'
                    const loadLabel = loadLevel==='alta'?'Carga alta':loadLevel==='media'?'Carga media':'Carga baja'
                    return (
                      <div key={u.id} style={{display:'flex',alignItems:'flex-start',gap:10,marginBottom:14,paddingBottom:14,borderBottom:'1px solid var(--border)'}}>
                        <div style={{position:'relative'}}>
                          <div className={`avatar ${COLOR_MAP[u.color]||'av-purple'}`}>{u.avatar_initials}</div>
                          <div style={{position:'absolute',bottom:-2,right:-2,width:10,height:10,borderRadius:'50%',background:loadColor,border:'2px solid var(--bg-surface)'}}/>
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4}}>
                            <span style={{fontSize:12,fontWeight:500}}>{u.full_name}</span>
                            <span style={{fontSize:10,fontWeight:600,color:loadColor}}>{loadLabel}</span>
                          </div>
                          {/* Contadores claros */}
                          <div style={{display:'flex',gap:10,marginBottom:6}}>
                            <span style={{fontSize:11,color:'var(--text-3)'}}><b style={{color:'var(--text)',fontFamily:'var(--mono)'}}>{active}</b> activas</span>
                            <span style={{fontSize:11,color:'var(--text-3)'}}><b style={{color:'var(--success)',fontFamily:'var(--mono)'}}>{u.completed||0}</b> completadas</span>
                            <span style={{fontSize:11,color:'var(--text-3)'}}><b style={{color:'var(--text)',fontFamily:'var(--mono)'}}>{total}</b> total</span>
                          </div>
                          {/* Barra de completado */}
                          <div style={{display:'flex',alignItems:'center',gap:6}}>
                            <div className="progress-bar" style={{flex:1}}>
                              <div className="progress-fill" style={{width:`${pct}%`,background:loadColor}}/>
                            </div>
                            <span style={{fontSize:10,color:'var(--text-3)',minWidth:28,textAlign:'right',fontFamily:'var(--mono)'}}>{pct}%</span>
                          </div>
                          <div style={{fontSize:9,color:'var(--text-3)',marginTop:2}}>% de tareas completadas</div>
                        </div>
                      </div>
                    )
                  })
              }
            </div>
          )}

          {/* Mini calendar — clickable to calendar page */}
          <div className="card">
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
              <span style={{fontSize:13,fontWeight:600}}>{format(new Date(),'MMMM yyyy',{locale:es}).replace(/^\w/,c=>c.toUpperCase())}</span>
              <button
                className="btn btn-sm"
                onClick={()=>navigate('/calendar')}
                style={{fontSize:11,color:'var(--accent)',borderColor:'var(--accent-light)',background:'var(--accent-light)'}}
              >
                Ver calendario →
              </button>
            </div>
            <div className="cal-grid" style={{cursor:'pointer'}} onClick={()=>navigate('/calendar')}>
              {['Lu','Ma','Mi','Ju','Vi','Sá','Do'].map(d=><div key={d} className="cal-header">{d}</div>)}
              {days.map(({date,other},i)=>{
                const dateStr=format(date,'yyyy-MM-dd')
                const hasTask=taskDates.has(dateStr)
                const today=isToday(date)
                return (
                  <div key={i} className={`cal-day ${today?'today':hasTask?'has-tasks':''} ${other?'other-month':''}`}>
                    {date.getDate()}
                    {hasTask&&!today&&<div className="cal-dot"/>}
                  </div>
                )
              })}
            </div>
            <div style={{marginTop:10,fontSize:11,color:'var(--text-3)',textAlign:'center'}}>
              {taskDates.size} días con tareas programadas este mes
            </div>
          </div>

          {/* Reports panel */}
          {isAdmin&&(
            <div className="card" style={{gridColumn:'1 / -1'}}>
              <div style={{fontSize:13,fontWeight:600,marginBottom:14}}>
                Reportes del día — {format(new Date(),'dd/MM/yyyy')}
              </div>
              {reports.length===0
                ? <div className="empty-state" style={{padding:20}}><div className="empty-icon">📝</div><div>Ningún colaborador ha enviado reporte hoy</div></div>
                : <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:12}}>
                    {reports.map(r=>(
                      <div key={r.id} className="report-card">
                        <div className="report-card-header">
                          <div className={`avatar ${COLOR_MAP[r.author?.color]||'av-purple'}`}>{r.author?.avatar_initials}</div>
                          <div style={{flex:1}}>
                            <div style={{fontWeight:500,fontSize:13}}>{r.author?.full_name}</div>
                            <div style={{fontSize:11,color:'var(--text-3)'}}>{MOODS[r.mood]||''}</div>
                          </div>
                          <span className={`badge b-${r.status==='aprobado'?'aprobado':r.status==='requiere_atencion'?'urgente':'pendiente-r'}`}>
                            {r.status==='aprobado'?'Aprobado':r.status==='requiere_atencion'?'Atención':'Pendiente'}
                          </span>
                        </div>
                        <div><div className="report-section-label">Qué hice</div><div className="report-section-text" style={{fontSize:12}}>{r.what_i_did}</div></div>
                        <div><div className="report-section-label">Qué logré</div><div className="report-section-text" style={{fontSize:12}}>{r.what_i_achieved}</div></div>
                      </div>
                    ))}
                  </div>
              }
            </div>
          )}
        </div>
      </div>

      {showModal&&<TaskModal onClose={()=>setShowModal(false)} onSaved={load}/>}
    </>
  )
}
