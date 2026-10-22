# Product Requirements Document (PRD)
## Project: Maintenance Copilot — Agentic RAG over Aviation Maintenance Logbooks

**Document Version:** 1.0.0  
**Status:** Approved for Implementation Planning (Milestone 0)  
**Author:** Antigravity AI Engineering Team  
**System Classification:** Aviation Maintenance Decision-Support & Historical Record Retrieval (Non-Autonomous)

---

## 1. Executive Summary & Objective

Aviation maintenance records (logbooks, defect reports, technician action sheets) contain unstructured, domain-dense text characterized by heavy technical jargon, inconsistent abbreviations (e.g., `A/C`, `CYL`, `MAG`, `R/H`, `CHT`), colloquial shorthand, typos, and truncated entries. Finding recurring defect patterns, historical fixes for rare anomalies, and cross-fleet component wear currently requires manual search across thousands of rows.

**Maintenance Copilot** is a portfolio-quality, full-stack decision-support application that enables aircraft maintenance engineers, technicians, and fleet inspectors to query historical aircraft logbooks in natural language and receive grounded, cited answers linked directly to original records.

### Safety & Operational Boundary
> [!IMPORTANT]
> **SAFETY NOTICE & OPERATIONAL BOUNDARY**  
> Maintenance Copilot is strictly a **decision-support and historical-record retrieval system**. It is **NOT** an automated aircraft maintenance or repair authorization tool, nor an autonomous airworthiness compliance system. It never issues airworthiness approvals, maintenance sign-offs, or structural authorizations. All operational actions must comply with approved Aircraft Maintenance Manuals (AMM), Structural Repair Manuals (SRM), Component Maintenance Manuals (CMM), Airworthiness Directives (AD), and applicable FAA/EASA/ICAO regulations under the direct supervision of licensed Aircraft Maintenance Technicians (AMTs) / A&P mechanics.

---

## 2. User Personas & User Stories

### 2.1 Personas
1. **Licensed Aircraft Maintenance Technician (AMT / A&P Mechanic):** Needs quick verification of historical remedies for recurring faults (e.g., "#3 cylinder exhaust valve sticking on Lycoming engine", "engine idle override speed drop").
2. **Fleet Reliability & Maintenance Engineer:** Analyzes recurring defect trends across engine baffles, intake gaskets, torquemeter lines, and cylinder compressions to plan scheduled replacements.
3. **Quality Assurance / Aviation Safety Auditor:** Traces maintenance actions back to verbatim logbook records, checking whether previous repairs adhered to service bulletins or repetitive inspections.

### 2.2 Core User Stories
- **US-1 (Ingestion & Schema Validation):** As an AMT, I want to import maintenance logbooks from CSV and JSON files, with automatic schema mapping, validation, and sanitization of noisy fields.
- **US-2 (Record Exploration):** As an engineer, I want a paginated, filterable explorer to view original raw entries alongside standardized/normalized text and extraction metadata.
- **US-3 (Natural Language Question Answering):** As an engineer, I want to ask questions like *"Have similar intake leaks occurred on #2 cylinder?"* and get an evidence-backed answer based only on retrieved logs.
- **US-4 (Transparent Citations):** As an auditor, I want every factual claim in the answer to have an inline citation linking directly to the specific Record ID, with an expandable card showing verbatim text, reported defect, corrective action, and match score.
- **US-5 (Controlled Agentic Workflow):** As a user, I want the system to recognize when an initial query is ambiguous, decompose complex multi-part comparisons, refine queries when results are thin, and stop with an explicit "Insufficient Evidence" response rather than hallucinating.
- **US-6 (Fleet Analytics Dashboard):** As a fleet manager, I want a visual analytics dashboard showing total records, top failing components, defect categories, and trend summaries, strictly labeled as historical descriptive statistics without fabricated safety forecasts.
- **US-7 (Evaluation & Transparency):** As an AI engineer, I want an automated evaluation benchmark computing Retrieval Recall@K, Mean Reciprocal Rank (MRR), Citation Precision/Validity, and latency so performance claims are empirically grounded.

---

## 3. Dataset Specification & Ingestion Requirements

### 3.1 Primary Dataset: MaintNet Aviation Maintenance Logbook
- **Source:** Cleaned MaintNet Aviation Maintenance Dataset ([Nadine Amin, GitHub](https://github.com/nadine-amin/Cleaned-MaintNet-Aviation-Maintenance-Dataset)), derived from MaintNet ([Akhbardeh et al., 2020 COLING](https://aclanthology.org/2020.coling-demos.2/)).
- **Volume:** 6,169 distinct maintenance entries (IDs `100001` through `106169`).
- **Input Formats Supported:**
  1. **Raw Logbook CSV:** Columns: `IDENT` (or `ID`), `PROBLEM` (defect description), `ACTION` (remediation text).
  2. **Extended Cleaned Format (Excel/JSON/CSV):** Columns: `ID`, `ORIGINAL_INSTANCE_PROBLEM`, `ORIGINAL_INSTANCE_ACTION`, `COMBINED_CLEANED_INSTANCE`, `PERFORMED_EDIT`.
  3. **Custom Enterprise CSV/JSON:** Flexible schema with configurable field mapping (Record ID, Aircraft Tail/ID, Date, Subsystem/Component, Reported Defect, Maintenance Action, Notes, Source Filename).

### 3.2 Auxiliary Dictionaries
- **Domain Abbreviation Dictionary:** 101 domain abbreviations and approved expansions (e.g., `A/C -> AIRCRAFT`, `CYL -> CYLINDER`, `ENG -> ENGINE`, `INSP -> INSPECTION`, `R/H -> RIGHT HAND`, `L/H -> LEFT HAND`, `RPM -> REVOLUTIONS PER MINUTE`, `PSI -> POUNDS PER SQUARE INCH`).
- **Unexpanded Abbreviation Guardlist:** 27 technical terms that must **never** be silently converted into definitive interpretations if context is ambiguous (e.g., `CHT`, `EGT`, `FOD`, `AD`, `CARB`, `CES`, `HMI`, `FDM`, `LMP`, `M/R`).
- **Misspelling Normalization Dictionary:** 115 verified aviation misspelling corrections (e.g., `ACCESORY -> ACCESSORY`, `ALVE -> VALVE`, `ASSEBLED -> ASSEMBLED`).

### 3.3 Normalization & Preservation Rules
1. **Verbatim Preservation:** The original text (`PROBLEM`, `ACTION`) is stored untouched in the database as the canonical ground truth.
2. **Derived Normalized View:** White-space normalized, lowercased/tokenized, with selective abbreviation expansion applied only to the search/embedding representation.
3. **No Silent Technical Reinterpretation:** Ambiguous abbreviations or cut-off codes (e.g., `IAW , CH`) are preserved with their ambiguity preserved, never filled with speculative manual identifiers.

---

## 4. Functional Requirements

### 4.1 Module A: Maintenance Record Management
- **FR-A1 (Upload):** Upload logbooks via Drag-and-Drop or File Picker (.csv, .json, .xlsx).
- **FR-A2 (Validation):** Validate required columns, discard or quarantine malformed rows, detect duplicates (by `record_id` and text hash), handle UTF-8/Latin-1 encodings.
- **FR-A3 (Explorer):** Paginated data table (25/50/100 records per page), searchable by Record ID, component, defect text, or action text.
- **FR-A4 (Detail Modal):** View complete record metadata: Record ID, Original Problem, Original Action, Cleaned Instance, Inferred Component Category, Date, Source Filename.

### 4.2 Module B: Search & Retrieval Engine (Hybrid RAG)
- **FR-B1 (Keyword Search):** Full-text lexical search supporting exact tokens (e.g., `baffle`, `gasket`, `100045`, `psi`).
- **FR-B2 (Semantic Search):** Dense vector similarity using embeddings (Sentence-Transformers `all-MiniLM-L6-v2` or BGE-small) over record representations combining problem and action text.
- **FR-B3 (Hybrid Fusion & Re-Ranking):** Reciprocal Rank Fusion (RRF) or normalized linear combination:
  $$\text{Score} = \alpha \cdot \text{DenseScore} + (1 - \alpha) \cdot \text{LexicalScore}$$
- **FR-B4 (Search Filters):** Filter by component subsystem (e.g., Engine Baffle, Intake System, Rocker Box, Valves, Fuel/Oil System) or Record ID range.

### 4.3 Module C: Controlled Agentic Workflow
- **FR-C1 (Intent Routing):** Classify query into:
  - `DIRECT_LOOKUP`: Single record or exact keyword lookup.
  - `SIMILAR_FAULT_SEARCH`: Broad search for recurring occurrences.
  - `RECORD_COMPARISON`: Compare corrective actions across records or components.
  - `CLARIFICATION_REQUIRED`: Query too ambiguous or lacking technical terms.
- **FR-C2 (Multi-Step Tool-Use Execution):**
  - Tool 1: `search_records(query, filters, limit)`
  - Tool 2: `get_record_by_id(record_id)`
  - Tool 3: `compare_records(record_ids)`
  - Tool 4: `verify_citations(answer, retrieved_ids)`
- **FR-C3 (Query Refinement):** If initial retrieval yields low similarity scores ($< 0.45$) or zero matches, the agent refines terms using expanded synonyms or broader subsystem tags.
- **FR-C4 (Bounded Iterations):** Agent execution bounded to a maximum of 3 iterations/steps to guarantee low latency and prevent infinite loops.
- **FR-C5 (Explicit Insufficient-Evidence Fallback):** When records do not support a factual answer, the agent explicitly returns:
  > *"Insufficient evidence in historical maintenance records to substantiate this query. No records found matching the specified parameters."*

### 4.4 Module D: AI Copilot Chat Interface
- **FR-D1 (Conversation State):** Maintain user session history with clear context resets.
- **FR-D2 (Inline Citations):** Answers format source claims with interactive badges (e.g., `[Rec #100014]`).
- **FR-D3 (Expandable Source Drawer):** Clicking a badge or expanding the "Sources Used" drawer highlights verbatim text, problem, action, and similarity score.
- **FR-D4 (Retrieval Explanation):** Provides an inspection view of "Why this record was retrieved" (keyword matches vs semantic overlap).
- **FR-D5 (Suggested Prompts):** Quick-click example aviation queries for fast technician onboarding.

### 4.5 Module E: Fleet Analytics & Dashboard
- **FR-E1 (Volume Metrics):** Total records imported, unique components, unique records with corrective actions.
- **FR-E2 (Defect Frequency Distribution):** Bar and Donut charts of top defect areas (e.g., Gasket Leakage, Baffle Cracking, Valve Guide Sticking, Low Compression).
- **FR-E3 (Severity & Action Breakdown):** Classification of maintenance actions (e.g., Replaced, Stop-Drilled, Reamed, Retorqued, Fabricated Patch).
- **FR-E4 (Ingestion & Search Audit):** Real-time display of dataset ingestion timestamp, vector index size, and recent search latency.
- **FR-E5 (Descriptive Boundary):** Prominent disclaimer distinguishing historical record summaries from forward-looking failure predictions.

### 4.6 Module F: Reproducible Evaluation Framework
- **FR-F1 (Benchmark Dataset):** Curated ground-truth test suite of 20+ realistic aviation maintenance questions with annotated relevant record IDs and canonical reference answers.
- **FR-F2 (Retrieval Metrics):** Automated calculation of Recall@K ($K \in \{3, 5, 10\}$) and Mean Reciprocal Rank (MRR).
- **FR-F3 (Generation Metrics):** Citation Precision (% of citations present in retrieved context), Citation Validity (% of citations pointing to existing database records), and lexical/semantic similarity against reference answers.
- **FR-F4 (Execution Script & Report):** Runnable CLI script and API endpoint returning an audit JSON/Markdown report with measured numbers (no fabricated scores).

---

## 5. Non-Functional Requirements

### 5.1 Performance & Latency
- Lexical search response time: $< 80$ ms for 6,000+ records.
- Semantic vector search response time: $< 200$ ms.
- Complete Agentic RAG turn (retrieval + LLM generation): $< 3.5$ s on standard LLM endpoints (or $< 800$ ms in local mock/cached mode).
- Frontend initial page load: $< 1.2$ s.

### 5.2 Security & Data Integrity
- **Untrusted Input Sanitation:** Uploaded CSV/JSON files are parsed via strict schemas with size limits (max 25MB, max 25,000 rows).
- **Prompt Injection Defense:** Retrieved logbook entries are encapsulated in structured data fences (`<record id="...">...</record>`) within system prompts, with explicit instructions forbidding the LLM from executing user-injected system instructions inside logbook text.
- **Secret Management:** No API keys, passwords, or tokens hardcoded. Configured entirely via `.env` with `.env.example` templates.
- **Audit Logging:** System logs query latency, retrieval step counts, and citation checks without persisting user private tokens.

### 5.3 Reliability & Portability
- **Graceful Fallbacks:** If the external LLM provider is unavailable or lacks an API key, the system seamlessly activates a deterministic Mock LLM / Rule-Based Extractor mode that summarizes retrieved evidence without breaking the application.
- **Cross-Platform:** Works on macOS, Linux, and Docker-supported platforms. Supports PostgreSQL with SQLite fallback for instant zero-dependency local runs.

---

## 6. Success Metrics
1. **Groundedness:** 100% of factual claims in generated answers cite an existing, retrieved Record ID.
2. **Citation Validity:** 0% phantom or hallucinated citations in benchmark test runs.
3. **Retrieval Recall@5:** $\ge 80\%$ on standard aviation fault retrieval benchmarks.
4. **Usability Score:** Clean enterprise visual aesthetics with sub-second table navigation and instant record lookup.
