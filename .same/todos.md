# Tareas - Agent Portal ATS

## Feature: Flexible Application Stages

### Rama: `feature/flexible-stages`

### Completado:
1. ✅ **Stage 1 = Job Description** (reemplazó "Your Journey Starts Now")
   - Muestra descripción completa del job
   - Info del cliente, compensación, requisitos
   - Card con CTA "Ready to apply?"

2. ✅ **Sistema de Stages Customizables:**
   - Stage types: info, questions, assessment, verification, documents, custom
   - Cada stage tiene nombre, descripción, orden
   - Stages se muestran en sidebar con iconos
   - Admin puede reorganizar stages (drag & drop)

3. ✅ **StageBuilder Component:**
   - Crear/editar/eliminar stages
   - Agregar preguntas ilimitadas por stage
   - Preview del flujo de aplicación
   - Configuración de tipo de stage

4. ✅ **Tipos Actualizados:**
   - `ApplicationStage` type definido
   - `StageType` enum agregado
   - `Opportunity` actualizado con `applicationStages`

5. ✅ **Admin UI:**
   - Link "Configure Stages" en dropdown de opportunities
   - Página `/admin/opportunities/[id]/stages`
   - Tabs: Stages, Preview, Settings

### Pendiente:
- [ ] Crear API endpoint para guardar stages (`PATCH /api/opportunities/[id]`)
- [ ] Persistir stages en base de datos
- [ ] Tests de la funcionalidad

### Estructura de Stages:
```
Opportunity
├── stages[]
│   ├── Stage 1: "Job Information" (info)
│   │   └── content: job description, requirements, compensation
│   ├── Stage 2: "Application Questions" (questions)
│   │   └── questions: [q1, q2, q3, ...]
│   ├── Stage 3: "Assessment" (assessment)
│   │   └── assessmentConfig: {...}
│   └── Stage 4: "Review & Submit" (info)
```

### Acceso:
- Admin puede configurar stages desde: Opportunities → (card) → ⋮ → Configure Stages
