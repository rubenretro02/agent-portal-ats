# Tareas - Agent Portal ATS

## Problema Original
La página se quedaba colgada al refrescar.

## Solución Implementada

### 1. Fix de carga infinita ✅
- Timeout de seguridad de 15s en AuthProvider
- API route primero para evitar RLS
- Validación de configuración de Supabase

### 2. Dashboard Unificado ✅
- Un solo `/dashboard` que detecta el rol del usuario
- Admin/Recruiter → ve AdminDashboard
- Agent → ve AgentDashboard
- Eliminadas rutas duplicadas `/admin/*`

## Nueva Estructura de Rutas

| Ruta | Acceso | Descripción |
|------|--------|-------------|
| `/dashboard` | Todos | Dashboard según rol |
| `/agents` | Admin/Recruiter | Gestión de agentes |
| `/opportunities` | Todos | Ver/crear oportunidades |
| `/applications` | Agent | Mis aplicaciones |
| `/profile` | Todos | Perfil de usuario |
| `/onboarding` | Agent | Onboarding |
| `/settings` | Todos | Configuración |

## Archivos Nuevos
- `src/components/layout/UnifiedLayout.tsx`
- `src/components/dashboard/AdminDashboard.tsx`
- `src/components/dashboard/AgentDashboard.tsx`
- `src/app/agents/page.tsx`

## Redirecciones
- `/admin` → `/dashboard`
- `/admin/agents` → `/agents`
- `/admin/opportunities` → `/opportunities`

## Estado
✅ COMPLETADO - Rama: `fix/page-loading-hang`
