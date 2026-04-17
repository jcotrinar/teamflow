// ── Demo data store ────────────────────────────────────────────
// Simula Supabase completamente en memoria con datos realistas

export const MOCK_USERS = [
  { id: 'u1', email: 'andrea@teamflow.com',    password: 'admin123',  full_name: 'Sra. Andrea',   role: 'admin',        color: 'purple', avatar_initials: 'AN' },
  { id: 'u2', email: 'karolay@teamflow.com',   password: 'karo123',   full_name: 'Sra. Karolay',  role: 'colaborador',  color: 'teal',   avatar_initials: 'KA' },
  { id: 'u3', email: 'carlos@teamflow.com',    password: 'carlos123', full_name: 'Carlos',        role: 'colaborador',  color: 'coral',  avatar_initials: 'CA' },
  { id: 'u4', email: 'maricarmen@teamflow.com',password: 'mari123',   full_name: 'Maricarmen',    role: 'colaborador',  color: 'blue',   avatar_initials: 'MC' },
  { id: 'u5', email: 'roberto@teamflow.com',   password: 'rob123',    full_name: 'Roberto',       role: 'colaborador',  color: 'amber',  avatar_initials: 'RO' },
]

const today = new Date()
const d = (offset) => { const dt = new Date(today); dt.setDate(dt.getDate() + offset); return dt.toISOString().split('T')[0] }

let _tasks = [
  { id: 't1',  title: 'Creación de Banners',             description: 'Diseñar banners para campaña de marzo',           status: 'en_curso',   priority: 'urgente', progress: 15, assigned_to: 'u3', created_by: 'u1', due_date: d(2),  tags: ['diseño','campaña'],    deliverable_url: 'https://drive.google.com/drive/folders/ejemplo-banners', created_at: d(-5) },
  { id: 't2',  title: 'Estructuras con Polaco',           description: 'Coordinar estructuras para el evento principal',  status: 'en_curso',   priority: 'alta',    progress: 50, assigned_to: 'u1', created_by: 'u1', due_date: d(10), tags: ['evento','logística'],   deliverable_url: '', created_at: d(-8) },
  { id: 't3',  title: 'Contratación locales y casas',     description: 'Gestionar contratos de locaciones para el show', status: 'en_curso',   priority: 'urgente', progress: 70, assigned_to: 'u1', created_by: 'u1', due_date: d(8),  tags: ['contratos'],           deliverable_url: '', created_at: d(-10) },
  { id: 't4',  title: 'Convocatoria Instructores',        description: 'Publicar convocatoria y filtrar candidatos',      status: 'en_curso',   priority: 'media',   progress: 40, assigned_to: 'u2', created_by: 'u1', due_date: d(15), tags: ['rrhh'],                deliverable_url: 'https://docs.google.com/spreadsheets/d/ejemplo-convocatoria', created_at: d(-3) },
  { id: 't5',  title: 'Revisión Micrófonos y Radios',     description: 'Verificar y etiquetar todos los equipos de audio',status: 'pendiente',  priority: 'media',   progress: 0,  assigned_to: 'u4', created_by: 'u1', due_date: d(5),  tags: ['equipos','audio'],     deliverable_url: '', created_at: d(-2) },
  { id: 't6',  title: 'Diseño de programa de mano',       description: 'Layout y contenido del programa impreso',        status: 'pendiente',  priority: 'alta',    progress: 0,  assigned_to: 'u3', created_by: 'u1', due_date: d(7),  tags: ['diseño','impresión'],  deliverable_url: '', created_at: d(-1) },
  { id: 't7',  title: 'Coordinación transporte artistas', description: 'Confirmar traslados para todos los artistas',    status: 'revision',   priority: 'alta',    progress: 85, assigned_to: 'u5', created_by: 'u1', due_date: d(3),  tags: ['logística'],           deliverable_url: 'https://docs.google.com/document/d/ejemplo-transporte', created_at: d(-12) },
  { id: 't8',  title: 'Redes sociales — pauta publicitaria',description: 'Configurar campañas en Meta y TikTok',        status: 'en_curso',   priority: 'urgente', progress: 30, assigned_to: 'u2', created_by: 'u1', due_date: d(1),  tags: ['marketing','digital'], deliverable_url: '', created_at: d(-4) },
  { id: 't9',  title: 'Montaje escenario',                description: 'Supervisar instalación del escenario principal', status: 'pendiente',  priority: 'baja',    progress: 0,  assigned_to: 'u5', created_by: 'u1', due_date: d(20), tags: ['producción'],          deliverable_url: '', created_at: d(-1) },
  { id: 't10', title: 'Reunión con proveedores de sonido',description: 'Confirmar specs técnicas con empresa de sonido', status: 'completada', priority: 'alta',    progress: 100,assigned_to: 'u4', created_by: 'u1', due_date: d(-3), tags: ['reunión','audio'],     deliverable_url: 'https://drive.google.com/drive/folders/ejemplo-sonido', created_at: d(-15) },
  { id: 't11', title: 'Catálogo de artistas confirmados', description: 'Lista final con riders y requerimientos',        status: 'completada', priority: 'urgente', progress: 100,assigned_to: 'u2', created_by: 'u1', due_date: d(-5), tags: ['artistas'],            deliverable_url: 'https://docs.google.com/spreadsheets/d/ejemplo-catalogo', created_at: d(-20) },
  { id: 't12', title: 'Presupuesto general del evento',   description: 'Consolidar presupuesto con todas las áreas',     status: 'completada', priority: 'urgente', progress: 100,assigned_to: 'u1', created_by: 'u1', due_date: d(-8), tags: ['finanzas'],            deliverable_url: '', created_at: d(-25) },
]

let _subtasks = [
  { id: 'st1', task_id: 't1', title: 'Diseñar banner principal 1200x628',   completed: true  },
  { id: 'st2', task_id: 't1', title: 'Diseñar versión para stories',         completed: false },
  { id: 'st3', task_id: 't1', title: 'Enviar a aprobación',                  completed: false },
  { id: 'st4', task_id: 't3', title: 'Contactar dueño local Miraflores',     completed: true  },
  { id: 'st5', task_id: 't3', title: 'Revisar contrato legal',               completed: true  },
  { id: 'st6', task_id: 't3', title: 'Firmar acuerdo y pagar anticipo',      completed: false },
  { id: 'st7', task_id: 't7', title: 'Confirmar van para artistas nocturnos',completed: true  },
  { id: 'st8', task_id: 't7', title: 'Coordinar aeropuerto día 1',           completed: true  },
  { id: 'st9', task_id: 't7', title: 'Coordinar aeropuerto día 2',           completed: false },
]

let _reports = [
  { id: 'r1', user_id: 'u2', report_date: d(0),  what_i_did: 'Avancé con la convocatoria de instructores. Contacté 3 locales para el evento y revisé propuestas.', what_i_achieved: 'Obtuve 2 cotizaciones favorables y cerré comunicación con un local en Miraflores.', blockers: '', mood: 4, status: 'pendiente', admin_note: '', created_at: d(0) },
  { id: 'r2', user_id: 'u3', report_date: d(0),  what_i_did: 'Trabajé en los banners de la campaña. Terminé el banner principal y empecé la versión para stories.', what_i_achieved: 'Banner principal completado y enviado a revisión preliminar.', blockers: 'Necesito la fuente tipográfica oficial del evento.', mood: 3, status: 'aprobado', admin_note: 'Buen avance. Te envío la fuente hoy.', created_at: d(0) },
  { id: 'r3', user_id: 'u5', report_date: d(0),  what_i_did: 'Coordiné el transporte de artistas para los dos primeros días del evento.', what_i_achieved: 'Aeropuerto día 1 y 2 confirmados. Solo falta la van nocturna.', blockers: '', mood: 5, status: 'aprobado', admin_note: 'Excelente gestión.', created_at: d(0) },
  { id: 'r4', user_id: 'u2', report_date: d(-1), what_i_did: 'Reunión con equipo de casting para convocatoria.', what_i_achieved: 'Definimos perfil de instructores buscados.', blockers: '', mood: 4, status: 'aprobado', admin_note: '', created_at: d(-1) },
  { id: 'r5', user_id: 'u3', report_date: d(-1), what_i_did: 'Investigación de referencias visuales para los banners.', what_i_achieved: 'Moodboard listo para empezar diseño.', blockers: '', mood: 4, status: 'aprobado', admin_note: '', created_at: d(-1) },
]

let _comments = [
  { id: 'c1', task_id: 't1', user_id: 'u1', content: 'Recuerda usar la paleta de colores del evento. Te comparto el brandbook.', created_at: d(-2) },
  { id: 'c2', task_id: 't1', user_id: 'u3', content: 'Entendido, ya lo tengo. El banner principal debería estar listo mañana.', created_at: d(-1) },
  { id: 'c3', task_id: 't3', user_id: 'u1', content: 'Prioridad máxima. Necesitamos el contrato firmado antes del viernes.', created_at: d(-5) },
]

let _nextId = 100

// ── Helpers ───────────────────────────────────────────────────
const ok = (data) => ({ data, error: null })
const err = (msg) => ({ data: null, error: { message: msg } })
const delay = (ms = 80) => new Promise(r => setTimeout(r, ms))
const newId = () => `x${++_nextId}`

const enrichTask = (t) => ({
  ...t,
  assigned: MOCK_USERS.find(u => u.id === t.assigned_to) || null,
  creator:  MOCK_USERS.find(u => u.id === t.created_by)  || null,
  subtasks: _subtasks.filter(s => s.task_id === t.id),
  comments: _comments.filter(c => c.task_id === t.id).map(c => ({
    ...c, author: MOCK_USERS.find(u => u.id === c.user_id)
  })),
})

// ── Auth ──────────────────────────────────────────────────────
export const mockSignIn = async (email, password) => {
  await delay()
  const user = MOCK_USERS.find(u => u.email === email && u.password === password)
  if (!user) return err('Correo o contraseña incorrectos')
  return ok({ user: { id: user.id, email: user.email } })
}

// ── Profiles ─────────────────────────────────────────────────
export const mockGetProfiles = async () => { await delay(); return ok(MOCK_USERS.map(({ password, ...u }) => u)) }

export const mockUpdateProfile = async (id, data) => {
  await delay()
  const i = MOCK_USERS.findIndex(u => u.id === id)
  if (i === -1) return err('No encontrado')
  Object.assign(MOCK_USERS[i], data)
  return ok(MOCK_USERS[i])
}

export const mockCreateUser = async (email, password, fullName, role, color) => {
  await delay()
  if (MOCK_USERS.find(u => u.email === email)) return err('El correo ya está en uso')
  const user = { id: newId(), email, password, full_name: fullName, role, color, avatar_initials: fullName.substring(0,2).toUpperCase() }
  MOCK_USERS.push(user)
  return ok(user)
}

// ── Tasks ─────────────────────────────────────────────────────
export const mockGetTasks = async () => {
  await delay()
  return ok([..._tasks].sort((a,b) => b.created_at.localeCompare(a.created_at)).map(enrichTask))
}

export const mockGetTaskById = async (id) => {
  await delay()
  const t = _tasks.find(t => t.id === id)
  return t ? ok(enrichTask(t)) : err('No encontrada')
}

export const mockCreateTask = async (task) => {
  await delay()
  const t = { ...task, id: newId(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
  _tasks.unshift(t)
  return ok(enrichTask(t))
}

export const mockUpdateTask = async (id, data) => {
  await delay()
  const i = _tasks.findIndex(t => t.id === id)
  if (i === -1) return err('No encontrada')
  _tasks[i] = { ..._tasks[i], ...data, updated_at: new Date().toISOString() }
  return ok(enrichTask(_tasks[i]))
}

export const mockDeleteTask = async (id) => {
  await delay()
  _tasks = _tasks.filter(t => t.id !== id)
  return ok(true)
}

export const mockUpdateProgress = async (id, progress) => mockUpdateTask(id, { progress })

// ── Subtasks ──────────────────────────────────────────────────
export const mockCreateSubtask = async (taskId, title) => {
  await delay()
  const st = { id: newId(), task_id: taskId, title, completed: false, created_at: new Date().toISOString() }
  _subtasks.push(st)
  return ok(st)
}

export const mockToggleSubtask = async (id, completed) => {
  await delay()
  const i = _subtasks.findIndex(s => s.id === id)
  if (i !== -1) _subtasks[i].completed = completed
  return ok(_subtasks[i])
}

// ── Reports ───────────────────────────────────────────────────
export const mockGetReports = async (date) => {
  await delay()
  let list = [..._reports]
  if (date) list = list.filter(r => r.report_date === date)
  list = list.sort((a,b) => b.created_at.localeCompare(a.created_at))
  return ok(list.map(r => ({ ...r, author: MOCK_USERS.find(u => u.id === r.user_id) })))
}

export const mockGetMyReports = async (userId) => {
  await delay()
  return ok(_reports.filter(r => r.user_id === userId).sort((a,b) => b.report_date.localeCompare(a.report_date)))
}

export const mockUpsertReport = async (report) => {
  await delay()
  const i = _reports.findIndex(r => r.user_id === report.user_id && r.report_date === report.report_date)
  if (i !== -1) {
    _reports[i] = { ..._reports[i], ...report }
    return ok(_reports[i])
  }
  const r = { ...report, id: newId(), created_at: new Date().toISOString() }
  _reports.push(r)
  return ok(r)
}

export const mockReviewReport = async (id, status, adminNote) => {
  await delay()
  const i = _reports.findIndex(r => r.id === id)
  if (i !== -1) { _reports[i].status = status; _reports[i].admin_note = adminNote }
  return ok(_reports[i])
}

// ── Comments ──────────────────────────────────────────────────
export const mockAddComment = async (taskId, userId, content) => {
  await delay()
  const c = { id: newId(), task_id: taskId, user_id: userId, content, created_at: new Date().toISOString() }
  _comments.push(c)
  return ok({ ...c, author: MOCK_USERS.find(u => u.id === userId) })
}

// ── Analytics ─────────────────────────────────────────────────
export const mockGetUserTaskSummary = async () => {
  await delay()
  return ok(MOCK_USERS.map(({ password, ...u }) => {
    const userTasks   = _tasks.filter(t => t.assigned_to === u.id)
    const activeTasks = userTasks.filter(t => ['pendiente','en_curso','revision'].includes(t.status))
    return {
      ...u,
      total_tasks:  userTasks.length,
      active_tasks: activeTasks.length,
      in_progress:  userTasks.filter(t => t.status === 'en_curso').length,
      completed:    userTasks.filter(t => t.status === 'completada').length,
      avg_progress: userTasks.length > 0 ? Math.round(userTasks.reduce((s,t) => s + t.progress, 0) / userTasks.length) : 0,
    }
  }))
}
