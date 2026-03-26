---
id: tech-stack-LTI
version: "1.0.0"
last_updated: "2026-03-23"
updated_by: "IA: init-project-docs"
status: active
type: rule
review_cycle: 180
owner_role: "Tech Lead"
---

# Rule: Convenciones del Stack Tecnológico — LTI

> **Nivel**: Técnico (Nivel 1)
> **Carga**: SIEMPRE — la IA aplica estas convenciones en cada línea de código generada.
> **Propósito**: Define CÓMO se escribe código en LTI.
> **Complementa**: org.md (estándares) y project.md (contexto)
> **Fuente de verdad**: @../../docs/projects/LTI/architecture.md

---

## 1. Stack Principal

| Capa     | Tecnología | Versión Mínima | Notas                                |
| -------- | ---------- | -------------- | ------------------------------------ |
| Frontend | React      | 18.3.1         | Functional components + hooks        |
| Backend  | Express    | 4.19.2         | TypeScript, no decorators            |
| ORM      | Prisma     | 5.13.0         | Siempre usar Prisma Client type-safe |
| DB       | PostgreSQL | 15             | Via Docker en dev                    |
| Lenguaje | TypeScript | 4.9.5          | strict: true obligatorio             |

---

## 2. TypeScript — Convenciones

- `strict: true` **SIEMPRE** en tsconfig.json
- `any`: **PROHIBIDO** — usar `unknown` + type guards o tipos explícitos
- Interfaces para shapes de datos (no `type` para objetos complejos)
- Enums de TypeScript para estados (ApplicationStatus, PositionStatus)
- DTOs tipados para request/response bodies

```typescript
// ✅ Correcto
interface CreateCandidateDTO {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

// ❌ Incorrecto
const createCandidate = (data: any) => { ... }
```

---

## 3. Express — Convenciones

- Rutas organizadas por recurso en archivos separados: `src/routes/candidates.ts`
- Middleware de error centralizado en `src/middleware/errorHandler.ts`
- Validación de input con Zod en cada endpoint
- Respuestas JSON con estructura consistente:

```typescript
// ✅ Éxito
res.json({ data: candidate, meta: { total, page } })

// ✅ Error
res.status(400).json({ error: "VALIDATION_ERROR", details: [...] })
```

- Nunca exponer stack traces en producción

---

## 4. Prisma — Convenciones

- Una sola instancia de PrismaClient (singleton en `src/lib/prisma.ts`)
- Siempre usar transacciones para operaciones multi-tabla
- Nunca usar `prisma.$queryRaw` salvo para queries muy específicas documentadas
- Modelos en PascalCase → tablas en snake_case (default Prisma)

```typescript
// ✅ Singleton
import prisma from "../lib/prisma";

// ❌ Nunca instanciar en cada handler
const prisma = new PrismaClient();
```

---

## 5. React — Convenciones

- Functional components **SIEMPRE** (no class components)
- Hooks propios en `src/hooks/useXxx.ts`
- Server state con **React Query** (cuando se instale)
- Formularios con **React Hook Form** + Zod
- No `useEffect` para fetching — usar React Query
- Componentes en PascalCase, hooks en camelCase con "use"

```tsx
// ✅ Correcto
const CandidateCard: React.FC<CandidateCardProps> = ({ candidate }) => { ... }

// ❌ Incorrecto
function candidatecard(props) { ... }
```

---

## 6. Naming Conventions

| Elemento          | Convención                | Ejemplo                       |
| ----------------- | ------------------------- | ----------------------------- |
| Componentes React | PascalCase                | `CandidateCard.tsx`           |
| Hooks             | camelCase con "use"       | `useCandidates.ts`            |
| Archivos backend  | kebab-case                | `candidate-routes.ts`         |
| Constantes        | UPPER_SNAKE_CASE          | `MAX_FILE_SIZE_MB`            |
| Enums             | PascalCase (values UPPER) | `ApplicationStatus.HIRED`     |
| DTOs              | PascalCase + "DTO"        | `CreateCandidateDTO`          |
| Prisma models     | PascalCase singular       | `User`, `Candidate`           |
| DB tables         | snake_case plural         | `candidates`, `job_positions` |

---

## 7. Testing

| Tipo        | Cobertura Mínima   | Herramienta      | Qué testear          |
| ----------- | ------------------ | ---------------- | -------------------- |
| Unit        | Lógica de negocio  | Jest             | Services, validators |
| Integration | Endpoints críticos | Jest + supertest | API routes           |
| Frontend    | Componentes clave  | Jest + RTL       | CandidateList, forms |

- Tests en `src/tests/` o `__tests__/` junto al archivo
- Nombres descriptivos: `should create candidate when valid data provided`
- No mockear Prisma en tests de integración — usar DB de test

---

## 8. Git Conventions

- Branch strategy: **feature branches** desde main
- Commits: **Conventional Commits** (feat:, fix:, docs:, refactor:, test:, chore:)
- PRs: Requieren al menos 1 reviewer, descripción con contexto
- Nunca commitear directamente a main
