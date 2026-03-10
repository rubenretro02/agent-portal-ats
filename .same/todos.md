# Tareas - Agent Portal ATS

## Problema Actual (RESUELTO)
El usuario no podía ver las oportunidades desde el lado de agente porque el system check nunca se completaba.

## Solución Implementada

### Fix: Dashboard siempre muestra oportunidades ✅
- El AgentDashboard ahora muestra **siempre** las oportunidades
- System check removido de los requisitos de onboarding
- Onboarding progress se muestra como barra de porcentaje compacta
- Los campos faltantes se muestran en un banner informativo
- El botón "Apply" está deshabilitado si el perfil no está completo
- Usuario puede VER las oportunidades aunque no pueda aplicar todavía

### Cambios en AgentDashboard.tsx
1. `onboardingProgress` calcula porcentaje y campos faltantes
2. Welcome banner con barra de progreso si no está completo
3. Banner compacto mostrando campos faltantes con link a /onboarding
4. Lista de oportunidades siempre visible
5. Badge "Complete Profile First" en lugar de bloquear la vista

## Estado
✅ COMPLETADO - Las oportunidades son visibles desde el dashboard

## Estructura de Rutas

| Ruta | Acceso | Descripción |
|------|--------|-------------|
| `/dashboard` | Todos | Dashboard según rol |
| `/agents` | Admin/Recruiter | Gestión de agentes |
| `/opportunities` | Todos | Ver/aplicar oportunidades |
| `/applications` | Agent | Mis aplicaciones |
| `/profile` | Todos | Perfil de usuario |
| `/onboarding` | Agent | Completar onboarding |
| `/settings` | Todos | Configuración |
