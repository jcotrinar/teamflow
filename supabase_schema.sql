-- ============================================================
-- TEAMFLOW — Schema completo para Supabase
-- Ejecuta esto en el SQL Editor de tu proyecto Supabase
-- ============================================================

-- Extensión para UUIDs
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────
-- TABLA: profiles (extiende auth.users)
-- ─────────────────────────────────────────
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text not null,
  role text not null default 'colaborador' check (role in ('admin', 'colaborador')),
  avatar_initials text,
  color text default 'purple',
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Todos pueden ver perfiles"
  on public.profiles for select using (true);

create policy "Usuario puede editar su propio perfil"
  on public.profiles for update using (auth.uid() = id);

create policy "Solo admin puede crear perfiles"
  on public.profiles for insert with check (true);

-- Trigger: crea perfil automáticamente al registrar usuario
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_initials)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    upper(substring(coalesce(new.raw_user_meta_data->>'full_name', new.email), 1, 2))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─────────────────────────────────────────
-- TABLA: tasks
-- ─────────────────────────────────────────
create table public.tasks (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  status text not null default 'pendiente' check (status in ('pendiente', 'en_curso', 'revision', 'completada', 'cancelada')),
  priority text not null default 'media' check (priority in ('urgente', 'alta', 'media', 'baja')),
  progress integer default 0 check (progress >= 0 and progress <= 100),
  assigned_to uuid references public.profiles(id),
  created_by uuid references public.profiles(id),
  due_date date,
  tags text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.tasks enable row level security;

create policy "Todos ven todas las tareas"
  on public.tasks for select using (true);

create policy "Admin puede crear tareas"
  on public.tasks for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admin puede editar cualquier tarea"
  on public.tasks for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Colaborador puede actualizar su progreso"
  on public.tasks for update using (assigned_to = auth.uid())
  with check (assigned_to = auth.uid());

create policy "Admin puede eliminar tareas"
  on public.tasks for delete using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Trigger: actualiza updated_at automáticamente
create or replace function public.update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger tasks_updated_at
  before update on public.tasks
  for each row execute procedure public.update_updated_at();

-- ─────────────────────────────────────────
-- TABLA: subtasks
-- ─────────────────────────────────────────
create table public.subtasks (
  id uuid default uuid_generate_v4() primary key,
  task_id uuid references public.tasks(id) on delete cascade,
  title text not null,
  completed boolean default false,
  created_at timestamptz default now()
);

alter table public.subtasks enable row level security;

create policy "Todos ven subtareas" on public.subtasks for select using (true);
create policy "Admin crea subtareas" on public.subtasks for insert with check (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Asignado puede completar subtareas" on public.subtasks for update using (
  exists (select 1 from public.tasks t where t.id = task_id and t.assigned_to = auth.uid())
  or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- ─────────────────────────────────────────
-- TABLA: daily_reports (reporte del día)
-- ─────────────────────────────────────────
create table public.daily_reports (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id),
  report_date date not null default current_date,
  what_i_did text not null,
  what_i_achieved text not null,
  blockers text,
  mood integer check (mood between 1 and 5),
  status text default 'pendiente' check (status in ('pendiente', 'aprobado', 'requiere_atencion')),
  admin_note text,
  created_at timestamptz default now(),
  unique(user_id, report_date)
);

alter table public.daily_reports enable row level security;

create policy "Admin ve todos los reportes"
  on public.daily_reports for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Colaborador ve sus reportes"
  on public.daily_reports for select using (user_id = auth.uid());

create policy "Colaborador crea su reporte"
  on public.daily_reports for insert with check (user_id = auth.uid());

create policy "Colaborador edita su reporte del día"
  on public.daily_reports for update using (user_id = auth.uid());

create policy "Admin puede actualizar estado del reporte"
  on public.daily_reports for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ─────────────────────────────────────────
-- TABLA: comments (comentarios en tareas)
-- ─────────────────────────────────────────
create table public.comments (
  id uuid default uuid_generate_v4() primary key,
  task_id uuid references public.tasks(id) on delete cascade,
  user_id uuid references public.profiles(id),
  content text not null,
  created_at timestamptz default now()
);

alter table public.comments enable row level security;
create policy "Todos ven comentarios" on public.comments for select using (true);
create policy "Usuarios autenticados comentan" on public.comments for insert with check (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- TABLA: notifications
-- ─────────────────────────────────────────
create table public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id),
  title text not null,
  message text,
  read boolean default false,
  type text default 'info' check (type in ('info', 'tarea', 'reporte', 'alerta')),
  created_at timestamptz default now()
);

alter table public.notifications enable row level security;
create policy "Usuario ve sus notificaciones" on public.notifications for select using (user_id = auth.uid());
create policy "Marcar como leída" on public.notifications for update using (user_id = auth.uid());
create policy "Sistema crea notificaciones" on public.notifications for insert with check (true);

-- ─────────────────────────────────────────
-- VISTA: task summary por usuario
-- ─────────────────────────────────────────
create or replace view public.user_task_summary as
select
  p.id,
  p.full_name,
  p.role,
  p.color,
  count(t.id) as total_tasks,
  count(t.id) filter (where t.status = 'en_curso') as in_progress,
  count(t.id) filter (where t.status = 'completada') as completed,
  round(avg(t.progress)) as avg_progress
from public.profiles p
left join public.tasks t on t.assigned_to = p.id
group by p.id, p.full_name, p.role, p.color;

-- ─────────────────────────────────────────
-- DATOS DE EJEMPLO (opcional)
-- ─────────────────────────────────────────
-- Descomenta si quieres datos de prueba después de crear usuarios manualmente:
/*
insert into public.tasks (title, description, status, priority, progress, due_date) values
('Creación de Banners', 'Diseñar banners para campaña de marzo', 'en_curso', 'urgente', 15, current_date + 5),
('Estructuras con Polaco', 'Coordinar estructuras para el evento', 'en_curso', 'alta', 50, current_date + 10),
('Contratación locales y casas', 'Gestionar contratos de locaciones', 'en_curso', 'urgente', 70, current_date + 8),
('Convocatoria Instructores', 'Publicar convocatoria y filtrar candidatos', 'en_curso', 'media', 40, null),
('Revisión Micrófonos y Radios', 'Verificar equipos de audio', 'pendiente', 'media', 0, null);
*/
