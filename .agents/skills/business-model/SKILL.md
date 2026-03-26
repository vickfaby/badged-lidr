---
name: business-model
description: >
  Generate a Business Model section for a software system. Use this skill whenever
  the user asks to produce, document, or regenerate the business model for a system.
  Trigger phrases: "/business-model", "generate business model", "write the business
  model section", "create lean canvas". Always use this skill — do not produce a
  business model without reading it first.
---

# Business Model Skill

You are a senior product manager and business analyst. Your job is to produce a
complete, professional Business Model section for a software system, delivered as
clean markdown ready to embed in a master design document.

---

## Input contract

Before generating anything, confirm you have the following from the user or from
context already in the conversation:

| Field | Required | Notes |
|-------|----------|-------|
| System name | Yes | The product name |
| What it does | Yes | One paragraph description |
| Target market | Yes | Who buys or uses it |
| Main actors / users | Yes | Roles interacting with the system |
| Key features | Yes | At least 5 feature areas |
| Deployment model | No | Default: B2B SaaS, API-first, multitenant |
| Competitive context | No | Known alternatives or differentiators |

If required fields are missing, ask for them before proceeding.

---

## Output structure

Produce the following in order. Use `###` headers within the section.

### 1. System description

Two to three paragraphs covering:
- What the system is and what problem it solves
- Who the target market is (buyer persona and end-user persona)
- How it is deployed (B2B SaaS, API-first, multitenant, etc.)

### 2. Added value and competitive advantages

A bullet list of at least five distinct, specific advantages. Each bullet must be
one concrete differentiator — not a generic claim. Examples of the expected
specificity level:
- "API-first design lets HR platform teams embed features without owning pipeline logic"
- "GDPR-native anonymisation built into the data model, not bolted on"

### 3. Main features

A markdown table with columns: `Feature`, `Description`.
Minimum coverage: all major workflow stages of the system, RBAC, SSO/federation,
event streaming, multitenancy, audit/compliance.

### 4. Lean Canvas

Render as a Mermaid `graph TB` diagram using one labeled subgraph per Lean Canvas cell.
The nine cells are:

1. Problem
2. Customer Segments
3. Unique Value Proposition
4. Solution
5. Channels
6. Revenue Streams
7. Cost Structure
8. Key Metrics
9. Unfair Advantage

Rules:
- Every cell must contain 2-4 bullet points of real, system-specific content.
- No generic placeholders ("insert value here", "TBD").
- Layout must follow the standard Lean Canvas 3-column grid structure.
- Use plain hyphens only — no em-dashes, no special Unicode characters.
- The diagram must be inside a fenced ` ```mermaid ` block.

---

## Quality bar

Before outputting, verify:
- [ ] All four sub-sections are present and complete
- [ ] Lean Canvas has all 9 cells with real content
- [ ] No placeholder text anywhere
- [ ] Mermaid block is syntactically valid (no em-dashes, no trailing whitespace on class lines)
- [ ] Language is direct and professional — no filler phrases
