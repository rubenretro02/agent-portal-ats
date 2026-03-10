# Tareas - Agent Portal ATS

## Problema Resuelto Ahora

### Error: `onboarding_completed` column not found ✅
- La columna `onboarding_completed` no existe en la tabla `agents` de Supabase
- Se eliminaron las referencias a esta columna en:
  - `OnboardingModal.tsx`
  - `OnboardingWidget.tsx`
- El onboarding ahora se completa correctamente sin errores

## Tarea Actual: Mejorar Constructor de Aplicaciones

### Solicitado por el usuario:
1. ✅ Corregir error en admin cuando va a opportunities (variables no definidas)
2. ✅ Eliminar el diálogo de "application link" que se abría al aplicar
3. ✅ Corregir error de columna `onboarding_completed` que no existe
4. 🔄 Crear constructor de aplicaciones tipo Fountain (step by step)
5. 🔄 Sin mostrar URL en el proceso de aplicación

### Progreso:
- [x] Eliminado diálogo de éxito con `applicationId` que causaba errores
- [x] Limpiado importaciones no utilizadas
- [x] El flujo ahora redirige a `/apply/[opportunityId]` para aplicaciones
- [x] Eliminada referencia a columna inexistente `onboarding_completed`
- [ ] Mejorar la página de aplicación para que sea más tipo Fountain

## Estructura de Rutas

| Ruta | Acceso | Descripción |
|------|--------|-------------|
| `/dashboard` | Todos | Dashboard según rol |
| `/agents` | Admin/Recruiter | Gestión de agentes |
| `/opportunities` | Todos | Ver/aplicar oportunidades |
| `/apply/[opportunityId]` | Agent | Aplicación paso a paso |
| `/applications` | Agent | Mis aplicaciones |
| `/profile` | Todos | Perfil de usuario |
| `/onboarding` | Agent | Completar onboarding |
| `/settings` | Todos | Configuración |
