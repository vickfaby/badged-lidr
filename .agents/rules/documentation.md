---
id: documentation-governance-LTI
version: "1.0.0"
last_updated: "2026-03-23"
updated_by: "IA: init-project-docs"
status: active
type: rule
review_cycle: 180
owner_role: "Tech Lead"
---

# Rule: Documentation Governance — LTI

> **Nivel**: Rule (contexto persistente — SIEMPRE cargado)
> **Propósito**: Estándares de documentación — frontmatter, versionado, staleness, DTC enforcement.
> **La IA aplica esta rule SIEMPRE que crea o modifica un archivo `.md` en el proyecto LTI**

---

## 1. Regla de Oro: Docs Travel with Code (DTC)

> La documentación viaja con el código. El Dev (o IA) que cambia código actualiza la documentación afectada **EN EL MISMO PR / COMMIT**.

---

## 2. Frontmatter Obligatorio

Todo archivo `.md` de proyecto requiere YAML frontmatter con estos campos:

```yaml
---
id: {tipo}-{proyecto}           # ej: architecture-LTI, db-schema-LTI
version: "1.0.0"                # semver
last_updated: "YYYY-MM-DD"      # fecha ISO del último cambio
updated_by: "Rol o IA: nombre"  # quién actualizó
status: draft | active | deprecated
type: project | rule | template | guide
review_cycle: 60                # días entre revisiones
owner_role: "Tech Lead"         # responsable de mantener
---
```

---

## 3. Staleness Detection

| Tipo de Doc                | TTL      | Acción si caduca               |
| -------------------------- | -------- | ------------------------------ |
| Rules (.claude/rules/)     | 180 días | Review por Tech Lead           |
| Project docs               | 60 días  | Review por responsable del doc |
| Templates                  | 120 días | Review por Tech Lead           |
| Specs (routes, components) | 60 días  | Actualizar tras cada sprint    |

---

## 4. Matriz de Impacto DTC — LTI

| Si cambias...                    | **DEBES** actualizar...                 |
| -------------------------------- | --------------------------------------- |
| Modelo Prisma (schema.prisma)    | `docs/projects/LTI/db-schema.md`        |
| Nuevo endpoint Express           | `docs/projects/LTI/specs/routes.md`     |
| Nuevo componente React           | `docs/projects/LTI/specs/components.md` |
| Tech stack (nueva librería)      | `docs/projects/LTI/architecture.md`     |
| Estrategia de storage/cache      | `docs/projects/LTI/specs/storage.md`    |
| Decisión arquitectónica          | ADR en `docs/projects/LTI/adrs/`        |
| Proceso de desarrollo del equipo | `.agents/rules/workflows.md`            |

---

## 5. Ubicación de Documentos LTI

```
docs/projects/LTI/
├── architecture.md        # Stack, componentes, deployment
├── db-schema.md           # Modelo de datos, Prisma schema
└── specs/
    ├── routes.md          # API endpoints + Frontend routes
    ├── components.md      # Catálogo de componentes React
    └── storage.md         # File storage, cache, state management
```

---

## 6. Anti-patrones — EVITAR

- Crear documentación duplicada fuera de `docs/projects/LTI/`
- Actualizar README.md del proyecto en lugar de los docs de `docs/projects/LTI/`
- Dejar secciones `⚠️ TODO` indefinidamente — tienen que resolverse antes del primer release
- Crear docs sin frontmatter
- Documentar implementación obvia — solo documentar el "por qué" y las decisiones
