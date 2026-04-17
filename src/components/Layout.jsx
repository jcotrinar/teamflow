import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import {
  LayoutDashboard, ListTodo, Kanban, Calendar,
  FileText, BarChart2, Users, LogOut, Bell, Settings
} from 'lucide-react'

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/tasks', icon: ListTodo, label: 'Tareas' },
  { to: '/kanban', icon: Kanban, label: 'Kanban' },
  { to: '/calendar', icon: Calendar, label: 'Calendario' },
  { to: '/reports', icon: FileText, label: 'Reporte del día' },
]

const ADMIN_NAV = [
  { to: '/analytics', icon: BarChart2, label: 'Analíticas' },
  { to: '/collaborators', icon: Users, label: 'Colaboradores' },
]

const COLOR_MAP = { purple: 'av-purple', teal: 'av-teal', coral: 'av-coral', blue: 'av-blue', pink: 'av-pink', amber: 'av-amber', green: 'av-green' }

export default function Layout() {
  const { profile, isAdmin } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const avatarClass = COLOR_MAP[profile?.color] || 'av-purple'

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-mark">TeamFlow</div>
          <div className="logo-sub">Gestión de tareas</div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Principal</div>
          {NAV.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to} to={to} end={end}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <Icon size={15} strokeWidth={1.8} />
              {label}
            </NavLink>
          ))}

          {isAdmin && (
            <>
              <div className="sidebar-section-label" style={{ marginTop: 8 }}>Administrar</div>
              {ADMIN_NAV.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to} to={to}
                  className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                >
                  <Icon size={15} strokeWidth={1.8} />
                  {label}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-pill" onClick={handleSignOut} title="Cerrar sesión">
            <div className={`avatar ${avatarClass}`}>
              {profile?.avatar_initials || '??'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {profile?.full_name}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-3)' }}>
                {isAdmin ? 'Administradora' : 'Colaborador/a'}
              </div>
            </div>
            <LogOut size={13} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
          </div>
        </div>
      </aside>

      <div className="main-area">
        <Outlet />
      </div>
    </div>
  )
}
