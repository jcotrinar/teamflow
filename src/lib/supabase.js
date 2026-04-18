import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ── Auth ─────────────────────────────────────────────────────
export const signIn = (email, password) =>
  supabase.auth.signInWithPassword({ email, password })

export const signOut = () => supabase.auth.signOut()

export const getSession = () => supabase.auth.getSession()

// ── Profiles ──────────────────────────────────────────────────
export const getProfiles = () =>
  supabase.from('profiles').select('*').order('full_name')

export const updateProfile = (id, data) =>
  supabase.from('profiles').update(data).eq('id', id)

// ── Tasks ─────────────────────────────────────────────────────
export const getTasks = () =>
  supabase.from('tasks')
    .select(`
      *,
      assignees:task_assignees(
        profile:profiles(id, full_name, avatar_initials, color)
      ),
      creator:profiles!tasks_created_by_fkey(id, full_name)
    `)
    .order('created_at', { ascending: false })

export const getTaskById = (id) =>
  supabase
    .from('tasks')
    .select(`
      *,
      assignees:task_assignees(
        profile:profiles(id, full_name, avatar_initials, color)
      ),
      subtasks(*),
      comments(*, author:profiles(*))
    `)
    .eq('id', id)
    .single()

export const createTask = (task) =>
  supabase.from('tasks').insert(task).select().single()

export const updateTask = (id, data) =>
  supabase.from('tasks').update(data).eq('id', id).select().single()

export const deleteTask = (id) =>
  supabase.from('tasks').delete().eq('id', id)

export const updateProgress = (id, progress) =>
  supabase.from('tasks').update({ progress }).eq('id', id)

// ── Subtasks ──────────────────────────────────────────────────
export const createSubtask = (taskId, title) =>
  supabase.from('subtasks').insert({ task_id: taskId, title }).select().single()

export const toggleSubtask = (id, completed) =>
  supabase.from('subtasks').update({ completed }).eq('id', id)

// ── Daily Reports ─────────────────────────────────────────────
export const getReports = (date) => {
  let q = supabase
    .from('daily_reports')
    .select('*, author:profiles(id, full_name, avatar_initials, color)')
    .order('created_at', { ascending: false })
  if (date) q = q.eq('report_date', date)
  return q
}

export const getMyReports = (userId) =>
  supabase
    .from('daily_reports')
    .select('*')
    .eq('user_id', userId)
    .order('report_date', { ascending: false })

export const upsertReport = (report) =>
  supabase
    .from('daily_reports')
    .upsert(report, { onConflict: 'user_id,report_date' })
    .select()
    .single()

export const reviewReport = (id, status, adminNote) =>
  supabase
    .from('daily_reports')
    .update({ status, admin_note: adminNote })
    .eq('id', id)

// ── Comments ──────────────────────────────────────────────────
export const addComment = (taskId, userId, content) =>
  supabase
    .from('comments')
    .insert({ task_id: taskId, user_id: userId, content })
    .select('*, author:profiles(*)')
    .single()

// ── Notifications ─────────────────────────────────────────────
export const getNotifications = (userId) =>
  supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)

export const markNotificationRead = (id) =>
  supabase.from('notifications').update({ read: true }).eq('id', id)

export const markAllRead = (userId) =>
  supabase.from('notifications').update({ read: true }).eq('user_id', userId)

// ── Analytics ─────────────────────────────────────────────────
export const getUserTaskSummary = () =>
  supabase.from('user_task_summary').select('*')

// ── Multi-assignees ───────────────────────────────────────────
export const getTaskAssignees = (taskId) =>
  supabase
    .from('task_assignees')
    .select('user_id, profile:profiles(id, full_name, avatar_initials, color)')
    .eq('task_id', taskId)

export const setTaskAssignees = async (taskId, userIds) => {
  // Borra los actuales y reinserta — más simple que hacer diff
  await supabase.from('task_assignees').delete().eq('task_id', taskId)
  if (!userIds.length) return { error: null }
  return supabase.from('task_assignees').insert(
    userIds.map(user_id => ({ task_id: taskId, user_id }))
  )
}
