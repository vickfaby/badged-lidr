---
id: workflows-LTI
version: "1.0.0"
last_updated: "2026-03-23"
updated_by: "IA: init-project-docs"
status: active
type: rule
review_cycle: 180
owner_role: "Tech Lead"
---

# Rule: Workflow Orchestration Map — LTI

> **Nivel**: Rule (contexto persistente — SIEMPRE cargado)
> **Propósito**: Define QUÉ comandos/skills usar, en qué ORDEN, y cómo se encadenan en el proyecto LTI.
> **La IA lee esta rule ANTES de ejecutar cualquier command**

---

## 1. Catálogo de Commands por Tier

### Tier 1 — Orchestrators (inicialización y setup)

| Command                           | Propósito                                | Cuándo usar                      |
| --------------------------------- | ---------------------------------------- | -------------------------------- |
| `/init-project-docs LTI`          | Inicializa scaffold de docs del proyecto | Primera vez o cuando faltan docs |
| `/lidr-validate-project-docs LTI` | Valida completitud y salud de los docs   | Antes de cada sprint planning    |
| `/lidr-architecture-doc`          | Genera/actualiza docs de arquitectura    | Tras cambios arquitectónicos     |
| `/sync-setup`                     | Sincroniza configuración de AI agents    | Tras cambios en `.agents/`       |

### Tier 2 — Development Workflow

| Command          | Propósito                                | Cuándo usar                             |
| ---------------- | ---------------------------------------- | --------------------------------------- |
| `/commit`        | Genera mensaje de commit convencional    | Antes de cada commit                    |
| `/validate-pr`   | Valida PR contra estándares del proyecto | Antes de crear PR                       |
| `/improve-docs`  | Audita y mejora documentación            | Post-sprint, cuando hay docs stale      |
| `/lidr-adr`      | Crea Architecture Decision Record        | Al tomar decisiones técnicas relevantes |
| `/enrich-ticket` | Valida completitud de tickets            | Antes de mover ticket a "Ready"         |

### Tier 3 — Tactical / Day-to-day

| Command / Skill        | Propósito                       | Cuándo usar                       |
| ---------------------- | ------------------------------- | --------------------------------- |
| `lidr-generate-rule`   | Genera archivos de rule         | Al crear nuevas reglas del equipo |
| `bdd-gherkin-patterns` | Escribe scenarios de aceptación | Al definir criterios de DoD       |
| `commit-management`    | Gestiona historial de commits   | Fix commits, squash, etc.         |
| `changelog-generator`  | Genera changelog desde git      | En cada release                   |

---

## 2. Flujo de Desarrollo (LTI)

```
Nueva feature / bug
       │
       ▼
 ┌─────────────┐
 │ Ticket creado│──→ /enrich-ticket (validar completitud)
 └─────────────┘
       │
       ▼
 ┌─────────────────────┐
 │ Decisión técnica?    │──YES──→ /lidr-adr (crear ADR)
 └─────────────────────┘
       │ NO
       ▼
 ┌──────────────────────────────────────┐
 │ Implementación                       │
 │ - Cambio en schema → actualizar db-schema.md │
 │ - Nuevo endpoint → actualizar routes.md      │
 │ - Nuevo componente → actualizar components.md│
 └──────────────────────────────────────┘
       │
       ▼
 ┌─────────────┐
 │ /commit      │ (genera mensaje convencional)
 └─────────────┘
       │
       ▼
 ┌─────────────┐
 │ /validate-pr │ (valida estándares antes del PR)
 └─────────────┘
```

---

## 3. Encadenamiento de Commands

| Después de...            | Ejecutar...                       | Condición                          |
| ------------------------ | --------------------------------- | ---------------------------------- |
| Cambiar schema Prisma    | Actualizar `db-schema.md`         | Siempre                            |
| Añadir endpoint API      | Actualizar `specs/routes.md`      | Siempre                            |
| Añadir componente React  | Actualizar `specs/components.md`  | Siempre                            |
| Terminar sprint          | `/lidr-validate-project-docs LTI` | Para detectar docs stale           |
| Tomar decisión técnica   | `/lidr-adr`                       | Si afecta stack, patrones, o infra |
| Cualquier implementación | `/commit`                         | Para mensaje de commit consistente |
| Antes de merge a main    | `/validate-pr`                    | Siempre                            |

---

## 4. Contexto de Docs para la IA

Cuando el usuario trabaja en LTI, la IA debe:

1. **Leer siempre primero**:
   - `@../../docs/projects/LTI/architecture.md` → contexto de stack
   - `@../../docs/projects/LTI/db-schema.md` → modelos existentes
   - `@../../docs/projects/LTI/specs/routes.md` → endpoints existentes

2. **Actualizar tras cambios**:
   - Si genera código con nuevos modelos → actualizar `db-schema.md`
   - Si genera nuevos endpoints → actualizar `specs/routes.md`
   - Si genera componentes nuevos → actualizar `specs/components.md`

3. **Advertir si**:
   - Un doc tiene `⚠️ TODO` en secciones críticas para la tarea actual
   - El schema de Prisma no refleja lo documentado en `db-schema.md`
