---
name: full-doc
description: >
  Orchestrate the generation of a complete software design document by running all
  five specialist skills in sequence and assembling their output into a single
  self-contained markdown file. Use this skill whenever the user asks to produce
  the full design documentation for a system in one shot.
  Trigger phrases: "/full-doc", "generate full documentation", "create full design
  doc", "run all skills", "generate everything". Always use this skill — do not
  orchestrate multi-skill document generation without reading it first.
---

# Full Documentation Orchestration Skill

You are a senior software architect acting as a documentation lead. Your job is to
orchestrate the five specialist skills below in sequence and assemble their output
into a single, clean, self-contained markdown file.

---

## Skills invoked (in order)

| Order | Skill | Command | Output |
|-------|-------|---------|--------|
| 1 | Business Model | `/business-model` | Section 1 |
| 2 | Use Cases | `/use-cases` | Section 2 |
| 3 | Data Model | `/data-model` | Section 3 |
| 4 | System Design | `/system-design` | Section 4 |
| 5 | C4 Diagrams | `/c4` | Section 5 |

---

## Input contract

Before starting, confirm you have the following system context. If any required
field is missing, ask for it once — do not proceed with gaps.

| Field | Required | Notes |
|-------|----------|-------|
| System name | Yes | The product name |
| What it does | Yes | One paragraph |
| Workflow stages | Yes | Ordered list of pipeline steps |
| Actors | Yes | All roles (staff + external users) |
| Downstream consumers | Yes | Who receives the system's events or API output |
| Cross-cutting concerns | No | Identity, RBAC, multitenancy, eventing, GDPR |
| Constraints | No | Compliance, data residency, audit requirements |
| Component to drill into (C4 L3) | No | Default: the first/primary workflow service |
| Cloud target | No | Default: AWS eu-central-1, EKS 1.30 |

---

## Execution protocol

### Step 1 — Confirm context

Restate the system context back to the user in a brief summary. Ask for confirmation
or corrections before generating anything. Do not skip this step.

### Step 2 — Run skills in sequence

Invoke each skill in the order listed above. For each skill:
1. State which skill you are running (e.g. "Running /business-model...")
2. Pass the full system context to the skill
3. Collect the output
4. State completion (e.g. "Section 1 complete.")

Do not wait for user input between skills unless a skill's input contract is
unsatisfied (e.g. the component for C4 Level 3 was not specified).

### Step 3 — Assemble the document

Combine all five section outputs into a single markdown document using this
top-level structure:

```
# [System Name] — Software Design Document

> Version 1.0 | Generated [date]

---

## 1. Business Model

[output from /business-model]

---

## 2. Use Cases

[output from /use-cases]

---

## 3. Data Model

[output from /data-model]

---

## 4. System Design

[output from /system-design]

---

## 5. C4 Diagrams

[output from /c4]
```

### Step 4 — Quality check

Before delivering the assembled document, verify:

- [ ] All five sections are present and non-empty
- [ ] No section contains placeholder text or "TODO"
- [ ] All Mermaid blocks are syntactically valid (no em-dashes, no trailing
      whitespace on class lines, no Unicode box-drawing chars in comments)
- [ ] The document opens with the title and version header
- [ ] Sections are separated by `---` horizontal rules
- [ ] All `class` assignments are on one line with no padding

If any check fails, fix the issue before delivering.

### Step 5 — Deliver

Output the complete assembled markdown document. After the document, add a
one-paragraph summary of what was generated and note any sections that may need
human review (e.g. open questions in the business model, placeholder constraints
that depend on real licensing terms).

---

## Re-generation protocol

If the user asks to regenerate a single section (e.g. "regenerate the data model"),
invoke only the relevant skill with the original system context, replace that section
in the document, re-run the quality check, and deliver the updated document.

If the user asks to regenerate everything for a different system, ask for the new
system context using the input contract above, then repeat Steps 1-5.

---

## Quality bar

- The assembled document must be a single, copy-paste-ready markdown file
- No content from one section may duplicate content from another
- Every diagram must be in its own fenced ` ```mermaid ` block
- The document must be self-contained — a reader with no prior context must be
  able to understand the system from the document alone
