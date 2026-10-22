# API Specification Document
## Project: Maintenance Copilot — Agentic RAG over Aviation Maintenance Logbooks

**Document Version:** 1.0.0  
**Status:** Approved for Implementation Planning (Milestone 0)  
**Base URL:** `http://localhost:8000/api`  
**OpenAPI Specification:** Available interactively at `/docs` (Swagger UI) and `/redoc` (ReDoc).

---

## 1. General Principles & Error Standards

### 1.1 Response Format
All successful JSON responses return standard payloads or paginated envelopes.
All error responses adhere to the RFC 7807 standard:

```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Maintenance record with ID 100099 does not exist.",
    "details": {},
    "timestamp": "2026-10-22T04:15:00Z"
  }
}
```

### 1.2 HTTP Status Codes
- `200 OK`: Request succeeded.
- `201 Created`: Ingestion or resource creation completed.
- `400 Bad Request`: Validation error, malformed file, missing required parameters.
- `404 Not Found`: Resource ID not found.
- `422 Unprocessable Entity`: Request body schema validation failed.
- `500 Internal Server Error`: Unhandled server exception.

---

## 2. Health & Diagnostic Endpoints

### 2.1 Health Check
- **Endpoint:** `GET /health`
- **Description:** Returns operational health status of API, database, and vector store.
- **Response (200 OK):**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "database": {
    "connected": true,
    "dialect": "sqlite",
    "record_count": 6169
  },
  "vector_store": {
    "ready": true,
    "indexed_vectors": 6169,
    "model": "all-MiniLM-L6-v2"
  },
  "timestamp": "2026-10-22T04:15:30Z"
}
```

---

## 3. Ingestion & Normalization Endpoints

### 3.1 Upload & Ingest Maintenance Records
- **Endpoint:** `POST /ingestion/upload`
- **Content-Type:** `multipart/form-data`
- **Form Parameters:**
  - `file`: Binary file (`.csv`, `.json`, `.xlsx`)
  - `format`: `maintnet_csv` | `maintnet_excel` | `custom_json` (optional, auto-detected if omitted)
  - `apply_normalization`: boolean (default: `true`)
- **Response (200 OK):**
```json
{
  "status": "success",
  "filename": "maintnet_aviation.csv",
  "total_rows_read": 6169,
  "records_imported": 6169,
  "duplicates_skipped": 0,
  "errors_encountered": 0,
  "processing_time_ms": 1420.5
}
```

### 3.2 Ingestion Status & Statistics
- **Endpoint:** `GET /ingestion/status`
- **Description:** Returns current ingestion summary and last update timestamp.
- **Response (200 OK):**
```json
{
  "is_ingested": true,
  "total_records": 6169,
  "last_ingested_at": "2026-10-22T04:10:00Z",
  "source_files": ["Cleaned Version of MaintNet Aviation Maintenance Dataset.xlsx"],
  "vector_index_status": "synchronized"
}
```

### 3.3 Normalization Dictionaries
- **Endpoint:** `GET /ingestion/dictionaries`
- **Description:** Returns domain abbreviations, unexpanded safety guards, and misspelling rules.
- **Response (200 OK):**
```json
{
  "total_abbreviations": 101,
  "sample_abbreviations": {
    "A/C": "AIRCRAFT",
    "CYL": "CYLINDER",
    "ENG": "ENGINE",
    "INSP": "INSPECTION",
    "L/H": "LEFT HAND",
    "R/H": "RIGHT HAND"
  },
  "unexpanded_safety_guards": [
    "CHT", "EGT", "FOD", "AD", "CARB", "CES", "HMI", "FDM", "LMP", "M/R"
  ],
  "total_misspellings": 115,
  "sample_misspellings": {
    "ACCESORY": "ACCESSORY",
    "ALVE": "VALVE",
    "ASSEBLED": "ASSEMBLED"
  }
}
```

---

## 4. Maintenance Records Endpoints

### 4.1 Query Paginated Records
- **Endpoint:** `GET /records`
- **Query Parameters:**
  - `page`: integer (default: `1`)
  - `page_size`: integer (default: `25`, max: `100`)
  - `query`: string (search term in problem/action/ID)
  - `component`: string (filter by component category)
  - `sort_by`: string (`record_id` | `created_at`)
  - `sort_order`: string (`asc` | `desc`)
- **Response (200 OK):**
```json
{
  "items": [
    {
      "id": 1,
      "record_id": "100004",
      "aircraft_id": null,
      "component_category": "CYLINDER",
      "reported_defect": "HAD ENGINE CHOKE & BRIEFLY LOSE POWER ON DEPARTURE. FULL THR",
      "maintenance_action": "PERFORMED ENGINE RUN UP, FOUND CYL 2 LOWER PLUG FOULED.",
      "combined_clean_text": "HAD ENGINE CHOKE AND BRIEFLY LOSE POWER ON DEPARTURE. FULL THROTTLE. PERFORMED ENGINE RUN UP, FOUND CYLINDER TWO LOWER PLUG FOULED.",
      "source_filename": "Cleaned Version of MaintNet Aviation Maintenance Dataset.xlsx"
    }
  ],
  "total": 6169,
  "page": 1,
  "page_size": 25,
  "total_pages": 247
}
```

### 4.2 Get Record Details by ID
- **Endpoint:** `GET /records/{record_id}`
- **Response (200 OK):**
```json
{
  "id": 1,
  "record_id": "100004",
  "aircraft_id": null,
  "component_category": "CYLINDER",
  "reported_defect": "HAD ENGINE CHOKE & BRIEFLY LOSE POWER ON DEPARTURE. FULL THR",
  "maintenance_action": "PERFORMED ENGINE RUN UP, FOUND CYL 2 LOWER PLUG FOULED.",
  "combined_clean_text": "HAD ENGINE CHOKE AND BRIEFLY LOSE POWER ON DEPARTURE. FULL THROTTLE. PERFORMED ENGINE RUN UP, FOUND CYLINDER TWO LOWER PLUG FOULED.",
  "performed_edit": null,
  "source_filename": "Cleaned Version of MaintNet Aviation Maintenance Dataset.xlsx",
  "created_at": "2026-10-22T04:10:00Z"
}
```

### 4.3 List Distinct Components
- **Endpoint:** `GET /records/components/list`
- **Response (200 OK):**
```json
{
  "components": [
    "BAFFLE",
    "CYLINDER",
    "ENGINE",
    "GASKET / INTAKE",
    "OIL SYSTEM / COOLER",
    "ROCKER COVER",
    "PROPELLER",
    "VALVE / EXHAUST",
    "WIRING / HARNESS"
  ]
}
```

---

## 5. Search Endpoints (Lexical, Semantic, Hybrid)

### 5.1 Hybrid Search
- **Endpoint:** `POST /search/hybrid`
- **Request Body:**
```json
{
  "query": "intake gasket leaking cylinder 2",
  "component": "GASKET / INTAKE",
  "top_k": 5,
  "dense_weight": 0.6,
  "lexical_weight": 0.4
}
```
- **Response (200 OK):**
```json
{
  "query": "intake gasket leaking cylinder 2",
  "total_hits": 482,
  "results": [
    {
      "record_id": "100009",
      "reported_defect": "#2 INTAKE IS LEAKING.",
      "maintenance_action": "REMOVED & REPLACED #2 INTAKE GASKET.",
      "component_category": "GASKET / INTAKE",
      "rrf_score": 0.0328,
      "dense_score": 0.884,
      "lexical_rank": 1,
      "match_reasons": ["Exact token match: 'intake', 'gasket', '#2'", "High semantic similarity to intake leakage query"]
    }
  ]
}
```

---

## 6. AI Copilot Chat Endpoints (Agentic RAG)

### 6.1 Execute Agentic Chat Turn
- **Endpoint:** `POST /chat`
- **Request Body:**
```json
{
  "session_id": "sess_8f3a9e2d-4b8c-4f1e",
  "query": "What maintenance actions were recorded when engine idle override caused shutdown?",
  "temperature": 0.1,
  "max_steps": 3
}
```
- **Response (200 OK):**
```json
{
  "session_id": "sess_8f3a9e2d-4b8c-4f1e",
  "answer": "Historical records indicate multiple distinct maintenance actions when an engine idle override killed the engine:\n\n1. Adjustment of idle speed was attempted repeatedly [Rec #100001].\n2. Replacement of the fuel servo was required when idle adjustment was insufficient [Rec #100002].\n3. An aircraft run-up was performed, setting idle speed and mixture with verification of no leaks [Rec #100003].\n\nTechnicians should inspect the fuel servo and mixture linkage if idle speed adjustment fails to resolve the shutdown.",
  "intent": "SIMILAR_FAULT_SEARCH",
  "step_count": 2,
  "agent_steps": [
    {
      "step": 1,
      "action": "search_records",
      "query": "engine idle override killed engine",
      "records_found": 3
    },
    {
      "step": 2,
      "action": "verify_citations",
      "cited_record_ids": ["100001", "100002", "100003"],
      "status": "verified"
    }
  ],
  "citations": [
    {
      "record_id": "100001",
      "reported_defect": "ENGINE IDLE OVERRIDE KILLED ENGINE.",
      "maintenance_action": "TRIED TO ADJUST IDLE SEVERAL TIMES, WOULDN'T ADJUST.",
      "excerpt": "TRIED TO ADJUST IDLE SEVERAL TIMES, WOULDN'T ADJUST.",
      "verified": true
    },
    {
      "record_id": "100002",
      "reported_defect": "ENGINE IDLE OVERRIDE KILLED ENGINE.",
      "maintenance_action": "REMOVED & REPLACED FUEL SERVO",
      "excerpt": "REMOVED & REPLACED FUEL SERVO",
      "verified": true
    },
    {
      "record_id": "100003",
      "reported_defect": "ENGINE IDLE OVERRIDE KILLED ENGINE.",
      "maintenance_action": "A/C WAS RUN UP, SET IDLE SPEED, MIXTURE OK, NO LEAKS NO",
      "excerpt": "A/C WAS RUN UP, SET IDLE SPEED, MIXTURE OK, NO LEAKS NO",
      "verified": true
    }
  ],
  "disclaimer": "Decision Support Notice: Grounded in historical maintenance logbook entries. Always refer to authorized maintenance manuals (AMM/CMM) and certified personnel before initiating aircraft repairs.",
  "latency_ms": 842.1
}
```

### 6.2 Chat Session History
- **Endpoint:** `GET /chat/sessions`
- **Response (200 OK):** List of historical sessions with message count and timestamps.
- **Endpoint:** `GET /chat/sessions/{session_id}`
- **Response (200 OK):** Full message history for specified session.
- **Endpoint:** `DELETE /chat/sessions/{session_id}`
- **Response (200 OK):** Clears session history.

---

## 7. Analytics & Dashboard Endpoints

### 7.1 Fleet Analytics Overview
- **Endpoint:** `GET /analytics/overview`
- **Response (200 OK):**
```json
{
  "total_records": 6169,
  "unique_components": 9,
  "top_failing_components": [
    { "component": "GASKET / INTAKE", "count": 1824, "percentage": 29.5 },
    { "component": "ROCKER COVER", "count": 1432, "percentage": 23.2 },
    { "component": "BAFFLE", "count": 1105, "percentage": 17.9 },
    { "component": "CYLINDER", "count": 892, "percentage": 14.5 }
  ],
  "top_maintenance_actions": [
    { "action_type": "REPLACED / INSTALLED NEW", "count": 3105 },
    { "action_type": "STOP DRILLED / PATCH FABRICATED", "count": 782 },
    { "action_type": "TIGHTENED / RETORQUED", "count": 643 },
    { "action_type": "REAMED VALVE GUIDE", "count": 218 }
  ],
  "disclaimer": "Historical descriptive statistics only. Does not constitute forward failure predictions or airworthiness risk assessments."
}
```

---

## 8. Evaluation Framework Endpoints

### 8.1 Execute Evaluation Benchmark
- **Endpoint:** `POST /evaluation/run`
- **Request Body (optional parameters):**
```json
{
  "top_k": 5,
  "run_generation": true
}
```
- **Response (200 OK):**
```json
{
  "run_id": "eval_20261022_0945",
  "timestamp": "2026-10-22T04:15:00Z",
  "num_test_cases": 20,
  "metrics": {
    "retrieval_recall_at_1": 0.70,
    "retrieval_recall_at_3": 0.85,
    "retrieval_recall_at_5": 0.95,
    "mean_reciprocal_rank": 0.782,
    "citation_precision": 1.00,
    "citation_validity": 1.00,
    "avg_retrieval_latency_ms": 42.6,
    "avg_generation_latency_ms": 780.4
  },
  "status": "completed"
}
```

### 8.2 Get Latest Evaluation Report
- **Endpoint:** `GET /evaluation/latest`
- **Response (200 OK):** Returns detailed benchmark report including per-query breakdowns and failure analysis.
