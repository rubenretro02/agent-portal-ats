# Tareas - Agent Portal ATS

## Feature: Flexible Application Stages

### Objetivo:
Crear un sistema de stages/etapas completamente flexible para las aplicaciones de jobs.

### Cambios Solicitados:
1. ✅ **Stage 1 = Job Description** (reemplazar "Your Journey Starts Now")
   - Mostrar descripción completa del job
   - Info del cliente, compensación, requisitos

2. 🔄 **Sistema de Stages Customizables:**
   - Stage 1: Job Description / Career Page
   - Stage 2: Assessment (skill verification)
   - Stage 3: Background Check
   - Stage 4+: Customizable
   - Sin orden fijo - admin puede reorganizar
   - Cada stage tiene mini-pasos/preguntas dentro

3. 🔄 **Preguntas Ilimitadas por Stage:**
   - Bug actual: Solo permite crear 1 pregunta
   - Solución: Arreglar el QuestionBuilder
   - Ver/editar preguntas existentes por job

4. 🔄 **Constructor de Jobs Flexible:**
   - Admin/Recruiter puede crear stages personalizados
   - Cada cliente contrata diferente
   - Agregar contenido/preguntas a cada stage

### Archivos a Modificar:
- [ ] `src/types/index.ts` - Agregar tipos ApplicationStage
- [ ] `src/components/admin/StageBuilder.tsx` - Nuevo componente
- [ ] `src/app/apply/[opportunityId]/page.tsx` - Usar stages
- [ ] `src/components/admin/QuestionBuilder.tsx` - Arreglar bugs
- [ ] `src/app/admin/opportunities/[id]/stages/page.tsx` - Nueva página

### Estructura de Stages:
```
Opportunity
├── stages[]
│   ├── Stage 1: "Job Description"
│   │   ├── type: "info"
│   │   └── content: job description, requirements
│   ├── Stage 2: "Application Questions"
│   │   ├── type: "questions"
│   │   └── questions: [q1, q2, q3, ...]
│   ├── Stage 3: "Assessment"
│   │   ├── type: "assessment"
│   │   └── assessmentConfig: {...}
│   └── Stage 4: "Background Check"
│       ├── type: "verification"
│       └── verificationConfig: {...}
```
