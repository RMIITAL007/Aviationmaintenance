# 🚀 Quick Start Guide — Maintenance Copilot

Get up and running with **Maintenance Copilot** in under 3 minutes.

---

## ⚡ 1. Prerequisites

- **Python**: 3.11 or 3.12 (Virtualenv configured at `.venv`)
- **Node.js**: 18+ and `npm`
- **Operating System**: macOS (Apple Silicon / Intel) or Linux

---

## 🏃 2. Fast Startup (Development Mode)

### Step 1: Start the FastAPI Backend
```bash
# From workspace root:
source .venv/bin/activate
export PYTHONPATH="${PWD}/backend"
uvicorn app.main:app --host 0.0.0.0 --port 8000
```
> **Backend URL**: [http://localhost:8000](http://localhost:8000)  
> **Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

### Step 2: Start the React + Vite Frontend
```bash
# In a second terminal:
cd frontend
npm run dev
```
> **Cockpit HUD UI**: [http://localhost:5173](http://localhost:5173)

### Step 3: Run the Verification Demo
```bash
./scripts/demo_copilot.sh
```

---

## 🤖 3. Inference Engine Configurations

Maintenance Copilot supports dynamic switching between **5 inference providers**:

| Provider | Type | Latency | Hardware Requirements | Setup |
| :--- | :--- | :--- | :--- | :--- |
| **Local Neural Model** | `SmolLM2-360M-Instruct` | ~1.5s | Apple Silicon MPS / CPU | Zero config (weights pre-cached) |
| **Verified Synthesizer** | Deterministic Assembly | <20ms | Minimal CPU | Zero config (100% grounded) |
| **Google Gemini** | Cloud API (`gemini-1.5-flash`) | ~800ms | Internet connection | Set `GEMINI_API_KEY` in UI |
| **OpenAI / Open-Router** | Cloud / Gateway (`gpt-4o-mini`)| ~1.2s | Internet connection | Set `OPENAI_API_KEY` in UI |
| **Local Ollama** | Daemon (`llama3.2`, `mistral`) | ~2.0s | Local Ollama running | Default `http://localhost:11434` |

Switch models anytime using the **`[MODEL]` button** in the top navbar or via curl:
```bash
curl -X POST http://localhost:8000/api/settings/model \
  -H "Content-Type: application/json" \
  -d '{"provider":"local","model_name":"HuggingFaceTB/SmolLM2-360M-Instruct"}'
```

---

## 📡 4. Key API Endpoints & Curl Recipes

### Health & Database Status
```bash
curl http://localhost:8000/api/health
```

### Hybrid BM25 + Dense Search
```bash
curl -X POST http://localhost:8000/api/search/hybrid \
  -H "Content-Type: application/json" \
  -d '{"query":"cracked engine air baffle","top_k":5}'
```

### Safety Discrepancies & Alerts Feed
```bash
curl http://localhost:8000/api/analytics/alerts
```

### Subsystem Comparison Matrix
```bash
curl "http://localhost:8000/api/analytics/compare?components=CYLINDER,BAFFLE,MAGNETO"
```

### Grounded Copilot Chat Turn
```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"query":"Have similar faults been reported for cylinder #2 intake gasket leaking?"}'
```

---

## 🧪 5. Automated Tests & Empirical Benchmark

### Run Backend Unit Tests (17/17 passing)
```bash
pytest backend/tests/ -v
```

### Run Empirical 20-Query Benchmark Audit
```bash
./run-evaluation.sh
```

---

## 🐳 6. Docker Deployment (Production)

To run both backend and frontend inside isolated containers:
```bash
docker compose up --build
```
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
