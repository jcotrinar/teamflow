# 🚀 Guía de despliegue de TeamFlow
## Costo total: $0 (gratis para siempre con este stack)

---

## PASO 1 — Crear proyecto en Supabase (base de datos)

1. Ve a **https://supabase.com** → "Start your project" → crea cuenta gratis
2. Clic en **"New project"**
   - Nombre: `teamflow`
   - Contraseña de base de datos: elige una segura y guárdala
   - Región: **South America (São Paulo)** — la más cercana a Perú
3. Espera ~2 minutos a que el proyecto se cree

4. Ve a **Settings → API** y copia:
   - `Project URL` → la necesitarás en el paso 3
   - `anon public` key → la necesitarás en el paso 3

5. Ve a **SQL Editor** (ícono de base de datos en la barra lateral)
6. Clic en **"New query"**, pega TODO el contenido del archivo `supabase_schema.sql` y clic en **"Run"**
   - Verás "Success. No rows returned" si todo salió bien

7. Ve a **Authentication → Settings**:
   - En "Site URL" pon `http://localhost:5173` (por ahora, lo cambiaremos después)
   - En "Email Auth" asegúrate de que esté habilitado

---

## PASO 2 — Configurar el proyecto localmente

Prerequisito: tener instalado **Node.js** (descargar en https://nodejs.org, versión LTS)

```bash
# 1. Entra a la carpeta del proyecto
cd teamflow

# 2. Crea el archivo de variables de entorno
cp .env.example .env.local

# 3. Abre .env.local y reemplaza con tus credenciales de Supabase:
#    VITE_SUPABASE_URL=https://XXXX.supabase.co
#    VITE_SUPABASE_ANON_KEY=eyXXXXXXXX...

# 4. Instala las dependencias
npm install

# 5. Inicia el servidor de desarrollo
npm run dev
```

Abre **http://localhost:5173** en tu navegador.

---

## PASO 3 — Crear el primer usuario (administradora)

1. Con el proyecto corriendo localmente, ve a **http://localhost:5173**
2. En el formulario de login **NO puedes registrarte aquí** — debes hacerlo desde Supabase:
   - Ve a tu proyecto Supabase → **Authentication → Users** → "Add user"
   - Email: tu correo
   - Password: tu contraseña
   - Clic en "Create user"
3. Ahora en tu base de datos, ve a **Table Editor → profiles**
   - Encuentra tu usuario y cambia el campo `role` de `colaborador` a `admin`
4. Inicia sesión en la app con tu correo y contraseña

---

## PASO 4 — Subir a Vercel (publicar en internet)

1. Crea cuenta gratis en **https://vercel.com** (puedes iniciar con GitHub)

2. Instala Vercel CLI o usa la interfaz web:

   **Opción A — Interfaz web (más fácil):**
   - Sube la carpeta `teamflow` a un repositorio de GitHub
   - En Vercel → "Add New Project" → importa tu repositorio
   - En "Environment Variables" agrega:
     - `VITE_SUPABASE_URL` = tu URL de Supabase
     - `VITE_SUPABASE_ANON_KEY` = tu anon key
   - Clic en "Deploy"

   **Opción B — CLI:**
   ```bash
   npm install -g vercel
   vercel login
   vercel --prod
   # Sigue las instrucciones, agrega las variables de entorno cuando te las pida
   ```

3. Vercel te dará una URL como `https://teamflow-tuequipo.vercel.app`

4. **Actualiza la URL en Supabase:**
   - Ve a Supabase → Authentication → Settings
   - Cambia "Site URL" por tu URL de Vercel
   - En "Redirect URLs" agrega también tu URL de Vercel

---

## PASO 5 — Agregar colaboradores

1. Inicia sesión como administradora en la app ya publicada
2. Ve a **Colaboradores** → "Agregar colaborador"
3. Completa nombre, correo y contraseña temporal
4. Comparte el link de la app + sus credenciales con cada colaborador

---

## Estructura del proyecto

```
teamflow/
├── src/
│   ├── components/
│   │   ├── Layout.jsx          # Sidebar + navegación
│   │   └── TaskModal.jsx       # Modal crear/editar tarea
│   ├── context/
│   │   └── AuthContext.jsx     # Sesión y perfil de usuario
│   ├── lib/
│   │   └── supabase.js         # Cliente y todas las queries
│   ├── pages/
│   │   ├── LoginPage.jsx       # Inicio de sesión
│   │   ├── DashboardPage.jsx   # Vista principal con métricas
│   │   ├── TasksPage.jsx       # Lista completa de tareas
│   │   ├── KanbanPage.jsx      # Tablero Kanban drag & drop
│   │   ├── CalendarPage.jsx    # Calendario mensual
│   │   ├── ReportsPage.jsx     # Reportes diarios
│   │   ├── AnalyticsPage.jsx   # Gráficas y estadísticas
│   │   └── CollaboratorsPage.jsx # Gestión de usuarios
│   ├── App.jsx                 # Rutas
│   ├── main.jsx                # Entrada
│   └── index.css               # Estilos globales
├── supabase_schema.sql         # Schema completo de la BD
├── .env.example                # Template de variables
├── vite.config.js
└── package.json
```

---

## Funcionalidades incluidas

### Para la administradora:
- ✅ Dashboard con métricas del equipo
- ✅ Crear, editar y eliminar tareas
- ✅ Asignar tareas a colaboradores
- ✅ Ver carga de trabajo por colaborador
- ✅ Tablero Kanban (drag & drop entre columnas)
- ✅ Calendario con todas las tareas programadas
- ✅ Ver y revisar reportes diarios del equipo
- ✅ Aprobar o marcar reportes que requieren atención
- ✅ Agregar notas en reportes
- ✅ Analíticas con gráficas de avance
- ✅ Gestionar colaboradores (crear, editar rol y color)

### Para los colaboradores:
- ✅ Ver sus tareas asignadas
- ✅ Actualizar el progreso con barra deslizante
- ✅ Cambiar estado de sus tareas
- ✅ Completar subtareas
- ✅ Ver el calendario con sus fechas límite
- ✅ Enviar reporte diario con estado de ánimo
- ✅ Ver historial de sus reportes anteriores
- ✅ Ver notas de la administradora en sus reportes

---

## Soporte y actualizaciones

El schema de Supabase tiene Row Level Security (RLS) activo, lo que significa que:
- Los colaboradores solo pueden ver/editar lo que les corresponde
- La administradora tiene acceso completo
- Los datos están protegidos aunque alguien obtenga la anon key

Para agregar funcionalidades en el futuro, el stack soporta:
- Notificaciones push (con Supabase Realtime)
- Adjuntar archivos (con Supabase Storage — gratis hasta 1GB)
- Exportar a PDF o Excel
- Modo oscuro
