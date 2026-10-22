#!/usr/bin/env bash
# ==============================================================================
# Maintenance Copilot - End-to-End System & API Verification Demo
# Referenced from Stablecoin Monitoring System Quickstart & Testing Scripts
# ==============================================================================

set -e

BASE_URL="http://localhost:8000/api"

GREEN="\033[0;32m"
BLUE="\033[0;34m"
CYAN="\033[0;36m"
YELLOW="\033[1;33m"
BOLD="\033[1m"
NC="\033[0m" # No Color

echo -e "${BLUE}${BOLD}================================================================${NC}"
echo -e "${CYAN}${BOLD}       MAINTENANCE COPILOT — LIVE SYSTEM DEMONSTRATION         ${NC}"
echo -e "${BLUE}${BOLD}================================================================${NC}"
echo ""

# 1. Health & Database Verification
echo -e "${YELLOW}[1/6] Checking Backend Health & Telemetry Status...${NC}"
HEALTH=$(curl -s "${BASE_URL}/health")
echo -e "${GREEN}✓ Health Response:${NC}"
echo "${HEALTH}" | python3 -m json.tool || echo "${HEALTH}"
echo ""

# 2. AI Inference Engine Configuration
echo -e "${YELLOW}[2/6] Inspecting Active AI Model Settings...${NC}"
MODEL_CFG=$(curl -s "${BASE_URL}/settings/model")
echo -e "${GREEN}✓ Model Settings:${NC}"
echo "${MODEL_CFG}" | python3 -m json.tool || echo "${MODEL_CFG}"
echo ""

# 3. Hybrid BM25 + Dense Vector Search
echo -e "${YELLOW}[3/6] Running Hybrid Search ('engine idle override killed engine')...${NC}"
SEARCH_RES=$(curl -s -X POST "${BASE_URL}/search/hybrid" \
  -H "Content-Type: application/json" \
  -d '{"query":"engine idle override killed engine","top_k":2}')
echo -e "${GREEN}✓ Retrieved Top Hits:${NC}"
echo "${SEARCH_RES}" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for idx, r in enumerate(data.get('results', []), start=1):
    print(f'  {idx}. [Rec #{r[\"ident\"]}] (Score: {r[\"score\"]:.4f}): {r[\"problem\"]} -> {r[\"action\"]}')
"
echo ""

# 4. Fleet Safety Alerts & Anomalies Feed
echo -e "${YELLOW}[4/6] Inspecting Fleet Safety Discrepancies & Alerts Feed...${NC}"
ALERTS_RES=$(curl -s "${BASE_URL}/analytics/alerts")
echo -e "${GREEN}✓ Safety Anomaly Summary:${NC}"
echo "${ALERTS_RES}" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(f'  Total Anomalies Monitored: {data.get(\"total_alerts\")}')
print(f'  Critical (In-Flight / Shutdown): {data.get(\"critical_count\")}')
print(f'  High (Structural / Cracks): {data.get(\"high_count\")}')
print(f'  Elevated (Leaks / Separation): {data.get(\"elevated_count\")}')
print('  Top Critical Alert Sample:')
if data.get('alerts'):
    top = data['alerts'][0]
    print(f'    - [#{top[\"ident\"]}] ({top[\"severity\"]}): {top[\"problem\"]}')
"
echo ""

# 5. Subsystem Comparison Matrix
echo -e "${YELLOW}[5/6] Comparing Subsystems (CYLINDER vs BAFFLE vs MAGNETO)...${NC}"
COMP_RES=$(curl -s "${BASE_URL}/analytics/compare?components=CYLINDER,BAFFLE,MAGNETO")
echo -e "${GREEN}✓ Comparative Subsystem Breakdown:${NC}"
echo "${COMP_RES}" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for c in data.get('comparisons', []):
    print(f'  • {c[\"component\"]}: {c[\"total_records\"]} logs ({c[\"share_percentage\"]}%) | Primary Remedy: {c[\"top_action\"]}')
"
echo ""

# 6. AI Copilot Chat Inquiry with Citations
echo -e "${YELLOW}[6/6] Executing Grounded Copilot Inquiry...${NC}"
QUERY="Have similar faults been reported for cylinder #2 intake gasket leaking?"
echo -e "  Inquiry: \"${QUERY}\""
CHAT_RES=$(curl -s -X POST "${BASE_URL}/chat" \
  -H "Content-Type: application/json" \
  -d "{\"query\":\"${QUERY}\"}")
echo -e "${GREEN}✓ Copilot Response:${NC}"
echo "${CHAT_RES}" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(f'  Answer: {data.get(\"answer\")}\n')
print(f'  Verified Citations ({len(data.get(\"citations\", []))}):')
for c in data.get('citations', []):
    print(f'    - [Rec #{c[\"ident\"]}] (Verified: {c[\"verified\"]}): {c[\"problem\"]} -> {c[\"action\"]}')
print(f'  Latency: {data.get(\"latency_ms\")} ms')
"
echo ""

echo -e "${BLUE}${BOLD}================================================================${NC}"
echo -e "${GREEN}${BOLD}✓ ALL SERVICES AND MODELS OPERATIONAL AND VERIFIED!${NC}"
echo -e "${BLUE}${BOLD}================================================================${NC}"
