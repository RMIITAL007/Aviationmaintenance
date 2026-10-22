# Maintenance Copilot ✈️
### Agentic RAG over Aviation Maintenance Logbooks

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![TailwindCSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

> **Maintenance Copilot** is a portfolio-quality decision-support AI application designed to help aircraft maintenance technicians (AMTs), fleet reliability engineers, and aviation safety auditors search, understand, and analyze historical aircraft maintenance logbooks using evidence-grounded Agentic RAG with verified citations.

---

## ⚠️ Important Safety & Regulatory Notice

> [!IMPORTANT]
> **DECISION-SUPPORT SYSTEM ONLY — NOT AN AUTHORIZED REPAIR AUTHORITY**  
> Maintenance Copilot is strictly a **decision-support and historical-record retrieval system**. It is **NOT** an autonomous aircraft maintenance system, nor does it provide airworthiness release, repair authorization, or compliance certification. All operational decisions, troubleshooting, and corrective actions must be performed in strict accordance with approved Aircraft Maintenance Manuals (AMM), Structural Repair Manuals (SRM), Component Maintenance Manuals (CMM), and Airworthiness Directives (AD) under the direct supervision of licensed Aircraft Maintenance Technicians (AMTs) / A&P mechanics.

---

## 🌟 Key Features

- **📂 Maintenance Record Management:** Ingest and parse noisy aviation logbooks from CSV, JSON, and Excel formats. Validates fields, deduplicates records, preserves verbatim text, and tags extracted components.
- **🔍 Domain Text Normalization:** Cleans white-space and technical shorthand while protecting 27 safety-critical unexpanded acronyms (`CHT`, `EGT`, `FOD`, `AD`, `M/R`) from ambiguous reinterpretation.
- **⚡ Hybrid Lexical & Semantic Retrieval:** Combines BM25 token matching with Sentence-Transformers dense vector embeddings (`all-MiniLM-L6-v2`) via Reciprocal Rank Fusion (RRF).
- **🤖 Bounded Agentic Workflow:** Multi-step tool-using state machine that classifies user intent, searches logbooks, reformulates ambiguous queries, compares multiple records, and enforces a strict 3-step ceiling.
- **📎 Grounded Citations & Anti-Hallucination Guard:** Inline source citations (`[Rec #100014]`) linking directly to verbatim records. Phantom citations are caught and flagged by a citation verification layer.
- **📊 Fleet Analytics Dashboard:** Visual summaries of defect distributions, top failing subsystems (intake gaskets, rocker covers, engine baffles), action breakdowns, and ingestion statistics.
- **🧪 Reproducible Evaluation Framework:** Built-in benchmarking module computing Retrieval Recall@K, Mean Reciprocal Rank (MRR), Citation Precision, Citation Validity, and latency over ground-truth test cases.

---

## 🏗️ System Architecture

```text
[ React 18 + Vite + TypeScript + Tailwind CSS ]
                       │  (Typed REST API Client)
                       ▼
[ FastAPI Gateway: Routes, Pydantic v2 Schemas ]
                       │
       ┌───────────────┼───────────────┐
       ▼               ▼               ▼
[ Ingestion & Norm ] [ Agent & RAG ] [ Analytics & Eval ]
       │               │               │
       ├───────────────┼───────────────┤
       ▼                               ▼
[ Hybrid Retrieval: BM25 + Vector ] [ Citation Grounding Guard ]
       │                               │
       ▼                               ▼
[ SQLite / PostgreSQL ORM ]   [ ChromaDB / FAISS Embeddings ]
```

---

## 📊 Dataset & Licensing

This application integrates the cleaned aviation maintenance logbook dataset:
- **Dataset Resource:** [Cleaned MaintNet Aviation Maintenance Dataset](https://github.com/nadine-amin/Cleaned-MaintNet-Aviation-Maintenance-Dataset) (Nadine Amin).
- **Original Source:** MaintNet Collaborative Library ([Akhbardeh et al., 2020 COLING](https://aclanthology.org/2020.coling-demos.2/)).
- **Volume:** 6,169 distinct maintenance entries (IDs `100001` through `106169`).
- **Domain Dictionaries Included:**
  - 101 expanded aviation abbreviations (`A/C -> AIRCRAFT`, `CYL -> CYLINDER`, `ENG -> ENGINE`).
  - 27 unexpanded acronym safety guards (`CHT`, `EGT`, `FOD`, `CARB`, `CES`, `HMI`).
  - 115 domain misspelling corrections (`ACCESORY -> ACCESSORY`, `ALVE -> VALVE`).
- **Licensing Note:** Publicly released for research, natural language processing evaluation, and educational development. Users intending commercial fleet deployment must ensure compliance with proprietary logbook data governance standards.

---

## 🚀 Quickstart Guide

### Prerequisites
- **Python:** 3.11+ (Python 3.12 recommended)
- **Node.js:** v18+ (Node v25 verified)
- **Git:** Installed

### 1. Clone & Set Up Environment Variables
```bash
git clone <repo-url> maintenance-copilot
cd maintenance-copilot

# Copy environment configuration
cp .env.example .env
```

### 2. Backend Setup
```bash
# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start backend server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation will be available at:
- Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health Check: [http://localhost:8000/api/health](http://localhost:8000/api/health)

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
Frontend application will be accessible at: [http://localhost:5173](http://localhost:5173).

### 4. Docker Compose (Alternative)
```bash
docker compose up --build
```

---

## ⚙️ Environment Configuration (`.env`)

| Variable | Description | Default |
| :--- | :--- | :--- |
| `DATABASE_URL` | SQLAlchemy connection string | `sqlite:///./maintenance_copilot.db` |
| `EMBEDDING_MODEL` | HuggingFace embedding model | `all-MiniLM-L6-v2` |
| `VECTOR_STORE_PATH` | Storage directory for vector index | `./data/vector_store` |
| `LLM_PROVIDER` | LLM backend: `mock`, `gemini`, `openai`, `ollama` | `mock` |
| `GEMINI_API_KEY` | Google Gemini API key (optional) | `""` |
| `OPENAI_API_KEY` | OpenAI API key (optional) | `""` |
| `MAX_AGENT_STEPS` | Ceiling for multi-step agent iterations | `3` |
| `LOG_LEVEL` | Application logging verbosity | `INFO` |

---

## 🧪 Evaluation Framework

Run the automated evaluation benchmark to measure retrieval and generation performance against the 20-case aviation ground-truth benchmark:
```bash
source .venv/bin/activate
python -m app.services.evaluation
```
Metrics measured:
- **Recall@1, Recall@3, Recall@5**
- **Mean Reciprocal Rank (MRR)**
- **Citation Precision & Citation Validity**
- **Retrieval & Answer Generation Latency**

---

## 📅 Milestone Tracker

- [x] **Milestone 0:** Environment & Dataset Inspection, Planning Documents (PRD, Architecture, API, Implementation Plan, README).
- [ ] **Milestone 1:** Project Foundation, Health Checks, Frontend & Backend Scaffold.
- [ ] **Milestone 2:** Data Ingestion, Schema Validation, Normalizer, Records Explorer.
- [ ] **Milestone 3:** Hybrid Lexical & Semantic Retrieval, Reciprocal Rank Fusion.
- [ ] **Milestone 4:** Grounded RAG, Pluggable LLM Adapter, Inline Citation Verification.
- [ ] **Milestone 5:** Controlled Multi-Step Agentic Workflow, Tool Use, Query Reformulation.
- [ ] **Milestone 6:** Fleet Analytics Dashboard & Reproducible Evaluation Suite.
- [ ] **Milestone 7:** Production Hardening, Test Suite, Security Checks, Final Polish.
