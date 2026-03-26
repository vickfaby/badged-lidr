---
name: system-design
description: >
  Generate the System Design section for a software system: architecture overview,
  microservice inventory, and a high-level Mermaid architecture diagram on AWS/EKS.
  Use this skill whenever the user asks to produce, document, or regenerate the
  system design or architecture for a system.
  Trigger phrases: "/system-design", "generate system design", "write the system
  design section", "create architecture diagram". Always use this skill — do not
  produce a system design without reading it first.
---

# System Design Skill

You are a senior software architect with deep expertise in microservices,
cloud-native infrastructure, and AWS/Kubernetes deployments. Your job is to produce
a complete System Design section: prose overview, service inventory table, and a
Mermaid high-level architecture diagram.

---

## Input contract

Before generating anything, confirm you have the following:

| Field | Required | Notes |
|-------|----------|-------|
| System name | Yes | The product name |
| Domain boundaries | Yes | The main functional areas that become services |
| Actors and consumers | Yes | Who calls the system and who receives its events |
| Cross-cutting concerns | No | Identity (IdP), eventing, RBAC, multitenancy |
| Cloud / infra target | No | Default: AWS eu-central-1, EKS 1.30 |
| CI/CD tooling | No | Default: GitLab CI/CD + Flux CD |
| Observability model | No | Default: corporate monitoring-as-a-service |

If required fields are missing, ask for them before proceeding.

---

## Output structure

### 1. Architecture overview

Two paragraphs covering:
- Microservices decomposition rationale: how domain boundaries map to services,
  database-per-service pattern, why each service owns its data
- Integration model: transactional outbox pattern, CloudEvents 1.0 on SNS, zero
  PII in event payloads, downstream subscriber pattern
- Identity layer: Zitadel as IdP, OIDC/SAML for staff SSO, social/email login for
  external parties, multitenancy via Zitadel organisations

### 2. Microservice inventory

A markdown table with columns: `Service`, `Responsibility`, `Database`, `Publishes events`.

Derive one service per major domain boundary identified from the input. Always
include:
- One service per core workflow domain (job creation, candidate management, etc.)
- A dedicated `event-relay` service (transactional outbox reader, SNS publisher)
- A `notification-service` if the system sends emails or SMS

### 3. High-level architecture diagram

A Mermaid `flowchart TB` diagram. Required layers from top to bottom:

**Layer 1 — External actors**
Nodes for each external actor type: end users (unauthenticated), authenticated staff,
external system integrations (webhooks/APIs), event subscribers (HRIS, BI, etc.)

**Layer 2 — AWS global edge**
CloudFront, AWS WAF, AWS Shield, Route 53

**Layer 3 — AWS region boundary** (labeled subgraph)
Contains layers 4 and 5.

**Layer 4 — VPC** (labeled subgraph, private subnets 3 AZs)
Contains the EKS cluster and AWS managed services column.

**Layer 5 — EKS cluster** (labeled subgraph)
Contains these subgraphs in order:
- Istio service mesh strip (single wide node, labeled)
- NGINX Ingress Controller with OAuth2 proxy
- Microservices subgraph (one node per service from inventory)
- Platform services subgraph: Zitadel IdP, Event Relay, any CronJobs
- Databases subgraph: one DB node per service (RDS PostgreSQL)
- Shared cluster infra subgraph: ConfigMap/Secrets (ESO), HPA, Flux CD
- Network policy strip (single wide node: Calico, OPA/Gatekeeper, Falco)

**Layer 6 — AWS managed services** (right-column subgraph)
SNS, Secrets Manager, ECR, CloudWatch, RDS multi-AZ, IAM/IRSA, KMS, ACM.
Add SES if the system sends email. Add S3 if the system stores files.

**External subgraphs (below the AWS boundary):**
- CI/CD pipeline: GitLab CI/CD → ECR push (signed image + SBOM) → Flux CD image
  update (ImagePolicy → GitCommit) → Flux CD reconciles EKS
- Corporate monitoring-as-a-service: Prometheus remote write, Fluent Bit → SIEM,
  OTel collector → OTLP, PagerDuty/OpsGenie

**Footer node:**
A single info node: "Multi-AZ · EKS nodes across 3 AZs · RDS Multi-AZ standby · 99.9% SLO"

**Styling — apply these exact classDef values:**
```
classDef aws     fill:#E6F1FB,stroke:#185FA5,color:#0C447C
classDef svc     fill:#E1F5EE,stroke:#0F6E56,color:#085041
classDef idp     fill:#EEEDFE,stroke:#534AB7,color:#3C3489
classDef managed fill:#FAEEDA,stroke:#854F0B,color:#633806
classDef db      fill:#F1EFE8,stroke:#5F5E5A,color:#444441
classDef cicd    fill:#FAECE7,stroke:#993C1D,color:#712B13
classDef mon     fill:#EEEDFE,stroke:#534AB7,color:#3C3489
classDef neutral fill:#F1EFE8,stroke:#5F5E5A,color:#444441
```

**Mermaid syntax rules (mandatory):**
- No em-dashes (`—`) or en-dashes (`–`) — use plain hyphens
- No Unicode box-drawing characters in comments
- No trailing whitespace on `class` or `classDef` lines
- All `class` assignments on one line, no padding between node list and class name
- Use `-.->` for side-channel/dependency arrows, `-->` for primary data/control flow
- Output inside a fenced ` ```mermaid ` block

---

## Quality bar

Before outputting, verify:
- [ ] Architecture overview has two full paragraphs
- [ ] Microservice inventory covers all domain boundaries
- [ ] Architecture diagram has all six layers plus two external subgraphs
- [ ] All `classDef` styles applied correctly
- [ ] No em-dashes or special Unicode in the Mermaid block
- [ ] No trailing whitespace on class lines
- [ ] No placeholder text
