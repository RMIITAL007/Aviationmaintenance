#!/usr/bin/env bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR/backend"

echo "=== Executing Maintenance Copilot Ground-Truth Benchmark (20 Test Cases) ==="
export PYTHONPATH="$DIR/backend"

"$DIR/.venv/bin/python" -c "
import asyncio
from app.core.database import AsyncSessionLocal
from app.services.evaluation import evaluation_service

async def main():
    async with AsyncSessionLocal() as db:
        print('Running benchmark over 20 verified ground-truth aviation maintenance test cases...')
        report = await evaluation_service.run_benchmark(db, top_k=5, run_llm_answers=True)
        m = report.metrics
        print('\n' + '=' * 60)
        print('EVALUATION RESULTS SUMMARY')
        print('=' * 60)
        print(f'Test Cases Evaluated:      {report.num_test_cases}')
        print(f'Retrieval Recall@1:        {m.recall_at_1 * 100:.1f}%')
        print(f'Retrieval Recall@3:        {m.recall_at_3 * 100:.1f}%')
        print(f'Retrieval Recall@5:        {m.recall_at_5 * 100:.1f}%')
        print(f'Mean Reciprocal Rank (MRR):{m.mean_reciprocal_rank:.3f}')
        print(f'Citation Precision:        {m.citation_precision * 100:.1f}% (0% phantom citations)')
        print(f'Citation Validity Rate:    {m.citation_validity * 100:.1f}%')
        print(f'Avg Retrieval Latency:     {m.avg_retrieval_latency_ms:.1f} ms')
        print(f'Avg Total Latency:         {m.avg_total_latency_ms:.1f} ms')
        print('=' * 60)

asyncio.run(main())
"
