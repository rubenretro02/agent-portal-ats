# Tareas - Agent Portal ATS

## Tarea Actual: Mejorar Constructor de Aplicaciones

### Solicitado por el usuario:
1. ✅ Corregir error en admin cuando va a opportunities (variables no definidas)
2. ✅ Eliminar el diálogo de "application link" que se abría al aplicar
3. 🔄 Crear constructor de aplicaciones tipo Fountain (step by step)
4. 🔄 Sin mostrar URL en el proceso de aplicación

### Progreso:
- [x] Eliminado diálogo de éxito con `applicationId` que causaba errores
- [x] Limpiado importaciones no utilizadas
- [x] El flujo ahora redirige a `/apply/[opportunityId]` para aplicaciones
- [ ] Mejorar la página de aplicación para que sea más tipo Fountain

## Problemas Resueltos

### Error en Opportunities (Admin) ✅
- El código tenía referencias a variables no definidas: `showSuccessDialog`, `applicationId`, `copied`, `copyApplicationId`
- Se eliminó el diálogo de éxito ya que el flujo ahora usa la página `/apply/[opportunityId]`

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
