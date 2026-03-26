---
id: org-LTI
version: "1.0.0"
last_updated: "2026-03-23"
updated_by: "IA: init-project-docs"
status: active
type: rule
review_cycle: 180
owner_role: "Tech Lead"
---

# Rule: Estándares Organizacionales — LTI

> **Nivel**: Organizacional (Nivel 1)
> **Carga**: SIEMPRE — este fichero se inyecta en cada sesión de IA sin excepción.
> **Propósito**: Define cómo trabaja el equipo LTI, qué valores rigen las decisiones, y qué estándares no son negociables.
> **Fuente de verdad extendida**: @../../docs/projects/LTI/architecture.md

---

## 1. Identidad del Proyecto

### 1.1 Qué es LTI

LTI (Talent Tracking System / Sistema de Seguimiento de Talento) es una aplicación web full-stack para gestión de procesos de reclutamiento. Permite a reclutadores gestionar candidatos, posiciones abiertas y pipelines de selección.

**Dominio**: HR Tech / ATS (Applicant Tracking System)
**Stack**: React 18 + Express 4 + Prisma 5 + PostgreSQL 15 + TypeScript 4.9
**Entorno local**: Backend :3010, Frontend :3000, PostgreSQL :5432 (Docker)

### 1.2 Datos Sensibles

| Tipo         | Ejemplos                          | Restricción                                        |
| ------------ | --------------------------------- | -------------------------------------------------- |
| PII          | Email, nombre, teléfono candidato | **NUNCA** loggear en texto plano                   |
| CVs/Docs     | Archivos de candidatos            | **SIEMPRE** acceso via signed URLs, no URL directa |
| Credenciales | Passwords de usuarios             | **NUNCA** en código ni logs — bcrypt/argon2        |
| Secrets      | DATABASE_URL, API keys            | **NUNCA** commitear — solo en .env (gitignored)    |

---

## 2. Filosofía de Desarrollo

- **Simplicidad primero**: La solución más simple que funcione. Evitar over-engineering.
- **Type safety**: TypeScript strict mode — `any` PROHIBIDO, usar `unknown` + type guards.
- **Docs Travel with Code (DTC)**: Todo cambio de código actualiza la documentación afectada en el mismo PR.
- **Tests como documentación**: Los tests describen el comportamiento esperado del sistema.

---

## 3. Calidad — Non-negotiables

| Regla                                   | Aplica a       |
| --------------------------------------- | -------------- |
| TypeScript strict: true                 | Todo el código |
| No `any` — usar tipos explícitos        | Todo el código |
| Tests para lógica de negocio crítica    | Backend        |
| Validación de input en endpoints API    | Backend        |
| No secretos en código fuente            | Todo el código |
| Actualizar docs si cambias arquitectura | PR gates       |

---

## 4. Roles del Proyecto

| Rol            | Responsabilidad Principal                 |
| -------------- | ----------------------------------------- |
| Tech Lead      | Arquitectura, decisions técnicas, ADRs    |
| Backend Dev    | Express routes, Prisma models, API logic  |
| Frontend Dev   | React components, UI/UX, state management |
| Full Stack Dev | Features end-to-end                       |

---

## 5. Políticas de Seguridad

- No commitear `.env` ni archivos con secretos
- Rate limiting obligatorio en endpoints públicos de auth
- CORS configurado explícitamente (no `*` en producción)
- Inputs validados con Zod o equivalente en todos los endpoints
