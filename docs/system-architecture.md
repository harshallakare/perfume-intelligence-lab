# Perfume Intelligence Lab — System Architecture

## 1. Overview

Perfume Intelligence Lab is a multi-tenant, AI-augmented ERP platform for perfume houses, clone brands, attar manufacturers, and fragrance labs. It combines a scientific formula engine, inventory ERP, olfactory intelligence, IFRA compliance, and AI-assisted formulation into a single cohesive platform.

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                                    │
│   Browser (Next.js SSR/CSR)   │   Mobile (Future)   │   API Clients      │
└────────────────┬────────────────────────┬────────────────────────────────┘
                 │ HTTPS/WSS              │ REST / GraphQL
┌────────────────▼────────────────────────▼────────────────────────────────┐
│                          API GATEWAY / EDGE                               │
│         Nginx / AWS ALB / Cloudflare   (TLS, Rate Limiting, WAF)         │
└────────────────────────────────┬─────────────────────────────────────────┘
                                 │
          ┌──────────────────────┼───────────────────────┐
          │                      │                        │
┌─────────▼──────────┐  ┌───────▼────────────┐  ┌───────▼──────────────┐
│   Core API Service │  │  AI Formula Engine  │  │  Clone Engine        │
│  (Node.js/FastAPI) │  │  (Python FastAPI)   │  │  (Python FastAPI)    │
│                    │  │                     │  │                      │
│  - Auth / RBAC     │  │  - LLM Orchestrator │  │  - Similarity Search │
│  - Inventory       │  │  - RAG Pipeline     │  │  - Formula Matching  │
│  - Formulas        │  │  - Prompt Engine    │  │  - Score Calculator  │
│  - Production      │  │  - Embedding Gen    │  │                      │
│  - Costing         │  │                     │  │                      │
│  - IFRA            │  │                     │  │                      │
└─────────┬──────────┘  └───────┬────────────┘  └───────┬──────────────┘
          │                     │                        │
          └──────────┬──────────┘────────────────────────┘
                     │
     ┌───────────────┼────────────────────┐
     │               │                    │
┌────▼────┐  ┌───────▼──────┐  ┌─────────▼────┐
│PostgreSQL│  │    Redis     │  │ Vector DB     │
│(Primary) │  │  (Cache +    │  │ (Qdrant /     │
│          │  │   Queues)    │  │  Pinecone)    │
│- OLTP    │  │              │  │               │
│- JSONB   │  │- Session     │  │- Fragrance    │
│- ENUM    │  │- Rate Limit  │  │  Embeddings   │
│- Full-   │  │- Job Queue   │  │- Formula Vecs │
│  text    │  │  (BullMQ)    │  │- Similarity   │
└──────────┘  └──────────────┘  └──────────────┘

         External Services
         ├── OpenAI / Anthropic / Gemini / DeepSeek (AI Providers)
         ├── Ollama (Local LLM)
         ├── AWS S3 / GCS (File Storage)
         ├── SendGrid / Resend (Email)
         └── IFRA Database (Compliance Data Feed)
```

---

## 3. Service Decomposition

### 3.1 Core API Service (Node.js with TypeScript)
Primary REST API. Handles all domain logic except AI inference.

| Domain | Key Responsibilities |
|--------|---------------------|
| Auth | JWT issuance, refresh, session management, RBAC enforcement |
| Organizations | Multi-tenant provisioning, plan management |
| Inventory | Materials, batches, stock ledger, supplier management |
| Formulas | Formula CRUD, versioning, scaling, section management |
| Production | Order lifecycle, maceration tracking, QC logs |
| IFRA | Compliance validation, allergen flagging, report generation |
| Costing | Cost-per-ml, margin calculation, pricing tiers |
| Perfume Library | Reference perfume CRUD, note mapping |
| Analytics | Aggregations, usage trends, performance metrics |

### 3.2 AI Formula Engine (Python FastAPI)
Handles LLM orchestration, RAG, and embedding generation. Decoupled from Core API to allow independent scaling and model swapping.

| Component | Technology |
|-----------|-----------|
| LLM Proxy | LiteLLM (unified interface for OpenAI, Anthropic, Gemini, Ollama) |
| Embedding Model | `text-embedding-3-small` or `nomic-embed-text` (local) |
| RAG Store | Qdrant (vector similarity search) |
| Context Builder | Custom prompt engineering layer with IFRA, inventory, and olfactory context injection |
| Response Parser | Structured output → Formula schema |

### 3.3 Clone Engine (Python FastAPI)
Standalone service for perfume similarity analysis and clone formula generation.

| Component | Responsibility |
|-----------|---------------|
| Embedding Matcher | Match target perfume embedding against formula library |
| Molecule Mapper | Map designer notes to available aroma chemicals |
| Score Calculator | Multi-axis similarity scoring (olfactory, longevity, projection) |
| Formula Generator | Construct weighted clone formula from matched molecules |

---

## 4. Data Flow Diagrams

### 4.1 Formula Creation Flow
```
User → Formula Builder UI
  → POST /api/formulas (Core API)
    → Validate ingredients against inventory
    → Run IFRA compliance check
    → Calculate cost via Costing Engine
    → Persist formula + version snapshot
    → Trigger embedding generation (async, AI Engine)
      → Store formula embedding in Qdrant
  ← Return formula with compliance status + cost summary
```

### 4.2 AI-Assisted Formulation Flow
```
User → AI Assistant UI (inputs: notes, mood, season, budget)
  → POST /api/ai/generate-formula (Core API → AI Engine)
    → Build context: available inventory, IFRA limits, user preferences
    → Construct RAG query → Qdrant similarity search
    → Inject context into LLM prompt
    → LLM generates structured formula JSON
    → Parse + validate against inventory
    → Run IFRA check + cost calculation
  ← Return formula with scores, alternatives, substitutes
```

### 4.3 Clone Generation Flow
```
User → Clone Engine UI (target perfume name, similarity %, budget)
  → POST /api/clone/generate (Core API → Clone Engine)
    → Look up target in Perfume Library
    → Embed target notes → Qdrant similarity search
    → Retrieve top-N matching formulas/molecules
    → Score and rank molecule candidates
    → Build weighted formula respecting budget + IFRA
    → Calculate similarity, projection, longevity estimates
  ← Return ranked clone formulas with scores
```

### 4.4 Inventory Stock Update Flow
```
Production Batch completion
  → PUT /api/production/batches/:id/complete (Core API)
    → Deduct consumed raw materials from inventory
    → Log inventory_transactions (debit per ingredient)
    → Check low-stock thresholds → Enqueue low-stock alerts
    → Update batch status → locked formula snapshot
  ← Return updated inventory state
```

---

## 5. Authentication & Authorization

### Strategy
- **Auth**: JWT (access token 15min) + Refresh Token (7d, stored in httpOnly cookie)
- **Multi-tenancy**: Every query scoped to `organization_id` via Row-Level Security (RLS) in PostgreSQL
- **RBAC**: Roles → Permissions → Resource/Action matrix checked at API middleware layer

### Roles & Permissions Matrix

| Permission | Admin | Perfumer | Prod. Manager | Inventory Mgr | Sales |
|-----------|:-----:|:--------:|:-------------:|:-------------:|:-----:|
| Manage Users | ✓ | | | | |
| Create Formula | ✓ | ✓ | | | |
| View Formula | ✓ | ✓ | ✓ | | ✓ |
| Lock Formula | ✓ | ✓ | | | |
| Manage Inventory | ✓ | | | ✓ | |
| View Inventory | ✓ | ✓ | ✓ | ✓ | |
| Manage Production | ✓ | | ✓ | | |
| View Costing | ✓ | ✓ | ✓ | ✓ | |
| Export Reports | ✓ | ✓ | ✓ | ✓ | ✓ |
| Configure AI | ✓ | | | | |

---

## 6. Database Architecture

### Primary: PostgreSQL 16
- Multi-tenant via `organization_id` on every table (RLS enforced)
- JSONB for flexible olfactory profiles and AI metadata
- Custom ENUMs for typed categorical fields
- Partitioning on `inventory_transactions` and `audit_logs` by month
- Full-text search on material names, formula names, perfume library

### Cache: Redis 7
- Session tokens
- Rate limiting counters
- Formula cost cache (invalidated on price update)
- AI generation job queues (BullMQ)

### Vector DB: Qdrant
- Collections: `formula_embeddings`, `molecule_embeddings`, `perfume_library_embeddings`
- Each vector linked to PostgreSQL ID for join-back
- Used by Clone Engine and AI RAG pipeline

---

## 7. API Design Conventions

- **Base URL**: `/api/v1/`
- **Auth**: `Authorization: Bearer <token>` on all protected routes
- **Tenant**: Resolved from JWT `organization_id` claim (no URL prefix needed)
- **Pagination**: Cursor-based for large collections (`?cursor=&limit=`)
- **Errors**: RFC 7807 Problem Details JSON
- **Versioning**: URL-based (`/v1/`, `/v2/`)

### Core Endpoints (abbreviated)

```
Auth
  POST   /api/v1/auth/register
  POST   /api/v1/auth/login
  POST   /api/v1/auth/refresh
  DELETE /api/v1/auth/logout

Inventory
  GET    /api/v1/materials
  POST   /api/v1/materials
  GET    /api/v1/materials/:id
  PUT    /api/v1/materials/:id
  GET    /api/v1/materials/:id/batches
  POST   /api/v1/materials/:id/stock-adjustment

Formulas
  GET    /api/v1/formulas
  POST   /api/v1/formulas
  GET    /api/v1/formulas/:id
  PUT    /api/v1/formulas/:id
  POST   /api/v1/formulas/:id/versions
  GET    /api/v1/formulas/:id/versions
  POST   /api/v1/formulas/:id/scale
  POST   /api/v1/formulas/:id/compliance-check
  GET    /api/v1/formulas/:id/costing

Clone Engine
  POST   /api/v1/clone/generate
  GET    /api/v1/clone/requests
  GET    /api/v1/clone/requests/:id

AI Engine
  POST   /api/v1/ai/generate-formula
  POST   /api/v1/ai/suggest-substitutes
  POST   /api/v1/ai/analyze-accord
  GET    /api/v1/ai/sessions

Production
  POST   /api/v1/production/orders
  GET    /api/v1/production/orders/:id
  POST   /api/v1/production/batches
  PUT    /api/v1/production/batches/:id/complete
  POST   /api/v1/production/batches/:id/qc-log

Compliance
  POST   /api/v1/compliance/validate
  GET    /api/v1/compliance/reports/:formulaId

Analytics
  GET    /api/v1/analytics/inventory-trends
  GET    /api/v1/analytics/material-usage
  GET    /api/v1/analytics/formula-performance
```

---

## 8. Infrastructure & Deployment

### Docker Compose (Development)
```
services:
  postgres      → port 5432
  redis         → port 6379
  qdrant        → port 6333
  core-api      → port 3001
  ai-engine     → port 8001
  clone-engine  → port 8002
  frontend      → port 3000
  nginx         → port 80/443
```

### Kubernetes (Production)
```
Namespaces:
  pil-core      → core-api (3 replicas), HPA on CPU
  pil-ai        → ai-engine (2 replicas), HPA on queue depth
  pil-data      → postgres (StatefulSet), redis (StatefulSet), qdrant (StatefulSet)
  pil-infra     → nginx-ingress, cert-manager, prometheus, grafana
```

### CI/CD (GitHub Actions)
```
On PR:   lint → type-check → unit tests → integration tests → preview deploy
On Main: full test suite → build Docker images → push to registry → deploy to staging
On Tag:  staging smoke tests → production deploy → post-deploy health checks
```

---

## 9. Security Considerations

| Concern | Mitigation |
|---------|-----------|
| Multi-tenant data leak | PostgreSQL RLS on all tables; `organization_id` enforced in middleware |
| Formula IP theft | Formula locking, audit logs, RBAC on export |
| AI API key exposure | Keys stored encrypted in DB, decrypted only at request time |
| SQL Injection | Parameterized queries only (Prisma ORM / SQLAlchemy) |
| IFRA liability | Compliance status stored immutably per formula version |
| Rate limiting | Redis-backed, per-user and per-org limits on AI endpoints |

---

## 10. Scalability Notes

- **Inventory transactions** table partitioned by month — high write volume expected
- **Formula embeddings** in Qdrant support millions of vectors with sub-10ms search
- **AI generation** is async: request → job enqueued → webhook/SSE when done
- **Read replicas**: Analytics queries routed to PG read replica to protect OLTP
- **Caching**: Formula costs cached in Redis (TTL 1h), invalidated on material price change
