---
id: project-LTI
version: "1.0.0"
last_updated: "2026-03-23"
updated_by: "IA: init-project-docs"
status: active
type: rule
review_cycle: 60
owner_role: "Tech Lead"
---

# Rule: Contexto del Proyecto Activo — LTI

> **Nivel**: Proyecto (Nivel 1)
> **Carga**: SIEMPRE — la IA necesita este contexto para entender en qué proyecto trabaja.
> **Propósito**: Define el dominio, el equipo, la arquitectura y el estado actual del proyecto.
> **Fuente de verdad extendida**: @../../docs/projects/LTI/architecture.md

---

## 1. Ficha del Proyecto

| Campo           | Valor                                                             |
| --------------- | ----------------------------------------------------------------- |
| **Nombre**      | LTI — Talent Tracking System                                      |
| **Repositorio** | AI4Devs-lab-ides-202602-Seniors                                   |
| **Objetivo**    | ATS full-stack para gestión de candidatos y procesos de selección |
| **Estado**      | En desarrollo — fase inicial / scaffold                           |
| **Tech Lead**   | ⚠️ TODO: Asignar                                                  |
| **Inicio**      | 2026-03-23                                                        |

---

## 2. Dominio de Negocio

### 2.1 Glosario

| Término     | Definición                                                                               |
| ----------- | ---------------------------------------------------------------------------------------- |
| Candidate   | Persona que aplica a una posición de trabajo                                             |
| JobPosition | Vacante o puesto de trabajo abierto en la empresa                                        |
| Application | Relación entre un Candidate y un JobPosition + estado en pipeline                        |
| Pipeline    | Flujo de etapas de selección: APPLIED → SCREENING → INTERVIEW → OFFER → HIRED / REJECTED |
| Recruiter   | Usuario del sistema que gestiona el proceso de selección                                 |
| ATS         | Applicant Tracking System — sistema de seguimiento de candidatos                         |

### 2.2 Etapas del Pipeline

```
APPLIED → SCREENING → INTERVIEW → OFFER → HIRED
                                         → REJECTED (desde cualquier etapa)
```

---

## 3. Arquitectura

**Patrón**: Modular Monolith

- Backend: Express 4 + TypeScript 4.9 en `backend/` (puerto 3010)
- Frontend: React 18 + TypeScript 4.9 en `frontend/` (puerto 3000)
- Base de datos: PostgreSQL 15 vía Docker (puerto 5432)
- ORM: Prisma 5.13.0

Ver detalle completo en @../../docs/projects/LTI/architecture.md

---

## 4. Estado del Código (2026-03-23)

| Componente    | Estado                          | Notas                                          |
| ------------- | ------------------------------- | ---------------------------------------------- |
| Backend       | Scaffold básico                 | Solo GET / health check, Prisma configurado    |
| Prisma Schema | Modelo User inicial             | Solo `id`, `email`, `name` — falta dominio ATS |
| Frontend      | CRA boilerplate                 | Sin páginas ni routing implementados           |
| Tests         | Archivos de test vacíos creados | Sin tests de negocio implementados             |
| Docker        | Configurado                     | PostgreSQL funcional                           |
| Auth          | No implementado                 | ⚠️ Prioritario para Sprint 1                   |

---

## 5. Documentación de Referencia

- Arquitectura completa: @../../docs/projects/LTI/architecture.md
- Schema BD: @../../docs/projects/LTI/db-schema.md
- Rutas API y Frontend: @../../docs/projects/LTI/specs/routes.md
- Componentes React: @../../docs/projects/LTI/specs/components.md
- Storage y State: @../../docs/projects/LTI/specs/storage.md

---

## 6. Reglas Específicas del Proyecto

- El backend NO tiene implementado ningún endpoint de negocio aún — no asumir que existen
- El frontend está en estado boilerplate CRA — no asumir que hay páginas o routing
- El schema de Prisma solo tiene el modelo `User` — todo el dominio ATS está por modelar
- Cuando se añadan nuevas entidades al schema Prisma, **SIEMPRE** actualizar `db-schema.md`
- Cuando se añadan nuevos endpoints, **SIEMPRE** actualizar `specs/routes.md`
- Cuando se añadan nuevos componentes, **SIEMPRE** actualizar `specs/components.md`

---

## 7. Próximos Pasos (backlog técnico)

1. Modelar dominio en Prisma: `Candidate`, `JobPosition`, `Application`
2. Implementar autenticación (JWT recomendado)
3. Implementar CRUD de candidatos (backend + frontend)
4. Implementar CRUD de posiciones
5. Implementar pipeline Kanban
6. Configurar React Router en frontend
7. Configurar React Query para server state
8. Crear seed data para desarrollo
