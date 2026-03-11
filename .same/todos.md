# Agent Portal ATS - Estado Actual

## Cambios Realizados

### ✅ Eliminado contenido hardcoded
- Apply page ya NO tiene texto mock como "Handle inbound/outbound calls"
- Solo muestra datos REALES de la oportunidad desde la base de datos

### ✅ Indicador de preguntas para Admin
- Admin/recruiter ahora ve en cada tarjeta de oportunidad cuántas preguntas tiene configuradas
- Muestra "X questions" o "No questions" según corresponda

### ✅ Columna application_stages agregada
- La tabla `opportunities` ahora tiene la columna `application_stages` (JSONB)
- Permite guardar stages personalizados configurados por admin

### ✅ Store actualizado
- `applicationStages` se carga desde `opp.application_stages` en la DB
- Las preguntas se cargan desde `applicationQuestions`

## Cómo funciona ahora:

### Para Admin/Recruiter:
1. Ver `/opportunities` - muestra todas las oportunidades con contador de preguntas
2. Click en "..." -> "Edit Details" - abre el formulario con ApplicationBuilder para agregar preguntas
3. Click en "..." -> "Configure Stages" - abre StageBuilder para configurar stages avanzados

### Para Agent:
1. Ver `/opportunities` - muestra solo oportunidades activas
2. Click "Apply" - inicia el flujo de aplicación multi-step
3. Cada stage muestra datos REALES de la oportunidad (descripción, compensación, etc.)
4. Las preguntas configuradas aparecen en el stage de Questions

## Estructura de datos:
```
opportunity.applicationQuestions = [
  { id, question, type, required, options, ... }
]

opportunity.applicationStages = [
  { id, name, type: 'info'|'questions'|..., order, questions: [...] }
]
```

## Pendiente:
- Integrar stages configurados con el apply flow
- Mostrar preview de stages en admin
