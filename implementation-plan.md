# Implementation Plan
## Project: Maintenance Copilot — Agentic RAG over Aviation Maintenance Logbooks

**Document Version:** 1.0.0  
**Status:** Approved for Implementation Planning (Milestone 0)  
**Author:** Antigravity AI Engineering Team  

---

## 1. Incremental Milestone Roadmap

The implementation is broken down into structured, incremental milestones with clear verification gates at each boundary.

```mermaid
gantt
    title Maintenance Copilot Implementation Roadmap
    dateFormat  YYYY-MM-DD
    section Milestones
    Milestone 0 : Inspect & Architecture Planning        :done, m0, 2026-10-22, 1d
    Milestone 1 : Project Foundation & Health Checks     :active, m1, after m0, 1d
    Milestone 2 : Data Ingestion & Normalizer Pipeline   :m2, after m1, 1d
    Milestone 3 : Hybrid Lexical & Semantic Retrieval    :m3, after m2, 1d
    Milestone 4 : Grounded RAG & Citation Guard          :m4, after m3, 1d
    Milestone 5 : Controlled Multi-Step Agentic Workflow :m5, after m4, 1d
    Milestone 6 : Fleet Analytics & Evaluation Benchmark :m6, after m5, 1d
    Milestone 7 : Production Hardening & Final Polish    :m7, after m6, 1d
```

---

## 2. Milestone Breakdown & Deliverables

### Milestone 0: Environment & Dataset Inspection (Completed)
- **Scope:**
  - Audit local machine runtime, package managers, tools, and databases.
  - Clone/download and analyze the MaintNet aviation maintenance dataset schema, abbreviations, and misspellings dictionaries.
  - Formulate product requirements (`product-requirements.md`), system architecture (`architecture.md`), API schema (`api.md`), implementation roadmap (`implementation-plan.md`), and master project guide (`README.md`).
- **Deliverables:**
  - 5 comprehensive documentation artifacts.
  - Local dataset cache in scratch directory.
  - Audit of environment runtimes (Node v25.8.2, Python 3.12.7, Git 2.46.2, PostgreSQL 16 available via Homebrew, SQLite 3).
- **Verification:**
  - All 5 documents generated and validated.
  - Cleaned MaintNet dataset confirmed with 6,169 records, 101 domain abbreviations, and 115 misspellings.

---

### Milestone 1: Project Foundation & Health Checks
- **Objective:** Establish the repository structure, initialize backend virtual environment (`.venv`), configure FastAPI with health endpoints, bootstrap React Vite frontend with Tailwind CSS, and configure Docker Compose / local launch scripts.
- **Backend Tasks:**
  1. Initialize Python virtual environment `.venv` using `python3 -m venv .venv`.
  2. Create `requirements.txt` with FastAPI, Pydantic, SQLAlchemy, Uvicorn, Python-dotenv.
  3. Create backend core: `config.py` (reading `.env`), `database.py` (SQLAlchemy engine supporting PostgreSQL and SQLite fallback).
  4. Implement `/api/health` and `/api/health/ready` endpoints.
- **Frontend Tasks:**
  1. Initialize Vite + React + TypeScript in `frontend/`.
  2. Configure Tailwind CSS with enterprise color tokens (Navy/Slate/Blue).
  3. Build application shell: Sidebar navigation, Header, responsive Container layout.
  4. Implement typed API client (`frontend/src/services/api.ts`) connecting to `/api/health`.
- **Infrastructure:**
  1. Create `.env.example` with clear parameter descriptions.
  2. Create `docker-compose.yml` defining backend, frontend, and PostgreSQL service.
  3. Add local dev launch scripts (`start-backend.sh`, `start-frontend.sh`).
- **Verification Gate:**
  - `curl http://localhost:8000/api/health` returns `200 OK` with JSON status.
  - Frontend starts on `http://localhost:5173` displaying system health badge and sidebar navigation.

---

### Milestone 2: Data Ingestion & Normalizer Pipeline
- **Objective:** Build robust file parsing, schema validation, domain text normalization, and persistent storage for aviation logbooks.
- **Deliverables:**
  1. `NormalizerService`: Applies whitespace normalization, selective abbreviation expansion, and misspelling correction without altering verbatim logbook text.
  2. `IngestionService`: Validates CSV, Excel (.xlsx), and JSON payloads; handles encoding issues, detects duplicate records, and extracts component tags.
  3. `Database Models & Repositories`: `MaintenanceRecord` SQLAlchemy model with fast indexed queries.
  4. API endpoints: `POST /api/ingestion/upload`, `GET /api/ingestion/status`, `GET /api/records` (paginated), `GET /api/records/{id}`.
  5. Frontend UI:
     - "Data Ingestion" page with drag-and-drop file upload, ingestion progress, and abbreviation dictionary viewer.
     - "Maintenance Records Explorer" with paginated table, sorting, search filters, and detail drawer.
- **Verification Gate:**
  - Ingest the 6,169 MaintNet records from the dataset.
  - Verify record counts and query record details via both UI table and API.
  - Automated tests validating encoding handling, abbreviation preservation, and schema validation.

---

### Milestone 3: Hybrid Lexical & Semantic Retrieval Engine
- **Objective:** Implement dual-mode lexical (BM25/token-based) and semantic (dense vector embeddings) search with Reciprocal Rank Fusion (RRF).
- **Deliverables:**
  1. Vector embedding generation using Sentence-Transformers `all-MiniLM-L6-v2`.
  2. Vector repository utilizing ChromaDB or local in-memory cosine index.
  3. Lexical search using SQLite FTS5 / PostgreSQL full-text search.
  4. Hybrid Rank Fusion combining lexical + dense ranks.
  5. API endpoints: `POST /api/search/lexical`, `POST /api/search/semantic`, `POST /api/search/hybrid`.
  6. Frontend UI: Interactive search bar in Explorer with dense/lexical weight sliders and result inspectability ("Why this record was matched").
- **Verification Gate:**
  - Query test: *"#2 intake gasket leaking"* retrieves record `100009` and related intake entries in top 3 results.
  - Unit tests verifying hybrid ranking math and zero-match empty result handling.

---

### Milestone 4: Grounded RAG & Citation Guard
- **Objective:** Connect retrieved logbook evidence to an LLM provider to answer maintenance queries strictly with grounded citations.
- **Deliverables:**
  1. Pluggable `LLMAdapter` supporting OpenAI, Google Gemini, Ollama, and an offline deterministic `MockLLMAdapter` for CI/testing without external API keys.
  2. Prompt builder isolating retrieved records in structured XML fences with prompt-injection defense.
  3. `CitationService`: Parses inline `[Rec #XXXXXX]` citations, checks them against retrieved IDs, and strips or flags hallucinated citations.
  4. Insufficient evidence detector: Explicitly informs the user when retrieved evidence does not support the query.
  5. Regulatory notice footer attached to all responses.
  6. Frontend UI: Chat interface with streaming/bubble responses, interactive citation pills, and expandable source preview cards.
- **Verification Gate:**
  - Test question: *"What action was taken when engine idle override killed the engine?"* yields answer citing `100001`, `100002`, `100003`.
  - Negative test question: *"What is the tire pressure on Boeing 777 nose gear?"* triggers explicit insufficient-evidence response without fabricating aircraft models.

---

### Milestone 5: Controlled Multi-Step Agentic Workflow
- **Objective:** Upgrade standard RAG into a controlled, multi-step tool-using agent capable of intent routing, query reformulation, record comparison, and bounded iterations.
- **Deliverables:**
  1. Intent classifier: Routes queries to Direct Lookup, Similar Fault Search, Record Comparison, or Clarification Required.
  2. Agent state machine with bounded execution (maximum 3 steps).
  3. Query reformulation engine: Broadens query terms if initial retrieval score is $< 0.45$.
  4. Record comparison tool: Structures side-by-side comparisons of corrective actions across multiple logbook entries.
  5. API response includes complete `agent_steps` transparency log.
  6. Frontend UI: Agent Thought / Action collapsible accordion displaying tool executions and query reformulations in real time.
- **Verification Gate:**
  - Complex query: *"Compare historical repairs for intake leaks versus baffle cracks"* executes multi-step retrieval and returns comparative answer with citations.
  - Step limit test: Proves the agent halts within 3 steps even under adversarial inputs.

---

### Milestone 6: Fleet Analytics & Evaluation Benchmark
- **Objective:** Deliver the operational dashboard and the reproducible evaluation suite.
- **Deliverables:**
  1. Analytics engine: Computes component failure distributions, action categorizations (Replaced, Stop-drilled, Reamed, Retorqued), and dataset health metrics.
  2. Dashboard UI: Clean visual charts (Recharts / Chart.js) with prominent descriptive disclaimer.
  3. Automated evaluation test suite: 20 curated aviation ground-truth question-evidence-answer pairs.
  4. Metric computation: Recall@K ($K=1, 3, 5$), MRR, Citation Precision, Citation Validity, Latency.
  5. API endpoints: `GET /api/analytics/overview`, `POST /api/evaluation/run`, `GET /api/evaluation/latest`.
  6. Frontend "Evaluation" tab rendering live benchmark execution and audit metrics.
- **Verification Gate:**
  - Run evaluation suite: generate empirical metrics without fabricated numbers.
  - Dashboard loads fleet metrics in $< 150$ ms.

---

### Milestone 7: Production Hardening, Testing & Documentation
- **Objective:** Final end-to-end verification, comprehensive automated test suite, security audit, and deployment instructions.
- **Deliverables:**
  1. Full automated test suite (Unit, Integration, API, Evaluation).
  2. Input validation and error handling for all edge cases (empty files, giant strings, malformed JSON).
  3. Clean Docker setup and environment configuration.
  4. Final documentation review and end-to-end verification demo script.
- **Verification Gate:**
  - All automated tests passing (`pytest tests/`).
  - Frontend production build succeeds (`npm run build`).
  - Complete application functional from a clean clone.

---

## 3. Risks, Assumptions, and Unresolved Decisions

### 3.1 Assumptions
1. **Dataset Authenticity:** The MaintNet aviation maintenance dataset represents genuine historical general-aviation defect reports (specifically Lycoming/Continental piston engine and related systems as reflected in the entries).
2. **Local Environment:** The developer machine has Node.js (v25), Python 3.12, and Homebrew. PostgreSQL service is present on disk and can be run, or SQLite can be used for zero-daemon local operation.
3. **LLM Provider Availability:** Users may or may not have a live OpenAI or Gemini API key. The system must run completely and verify all features using the configurable offline Mock / Rule-Based adapter when no external key is configured.

### 3.2 Risks & Mitigation Strategies
| Risk | Severity | Mitigation Strategy |
| :--- | :--- | :--- |
| **Silent Abbreviation Corruption** | High | Introduce strict `unexpanded_abbr` guardlist (CHT, EGT, FOD, AD, etc.) that blocks automated rewriting of safety-critical acronyms. |
| **LLM Hallucination / Phantom Citations** | High | Post-generation citation validation layer compares all cited Record IDs against the candidate IDs in the context window. Discrepancies are flagged or rejected. |
| **Infinite Agent Loop / High Cost** | Medium | Hard stop at 3 agent steps in the state machine; no open-ended recursive LLM loops permitted. |
| **Heavy Dependency Bloat / Torch Compatibility** | Medium | Use optimized ONNX / lightweight Sentence-Transformers (`all-MiniLM-L6-v2`) or ChromaDB default embedding pipeline to avoid multi-gigabyte PyTorch burdens. |
| **Docker Daemon Absence on Local Mac** | Low | Provide dual runtime paths: (a) Docker Compose for containerized deployment, and (b) native shell scripts (`npm run dev` + `uvicorn`) for frictionless local development. |

### 3.3 Unresolved Decisions to Align with User
1. **Primary Local Database Choice:** Default to SQLite (zero-config local) or start Homebrew PostgreSQL 16? *(Recommendation: Support both via SQLAlchemy config `DATABASE_URL`, defaulting to SQLite for immediate one-command startup).*
2. **Default LLM Provider:** Do you want to use Google Gemini API, OpenAI API, Ollama (local), or the Offline Mock Adapter for initial milestone runs? *(Recommendation: Provide a configurable `.env` adapter defaulting to Mock/Gemini with effortless switching).*
