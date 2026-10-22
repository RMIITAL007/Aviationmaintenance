from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.evaluation import EvaluationReportResponse, EvaluationRunRequest
from app.services.evaluation import evaluation_service, GROUND_TRUTH_BENCHMARK

router = APIRouter(prefix="/evaluation", tags=["Evaluation"])

@router.post("/run", response_model=EvaluationReportResponse)
async def run_evaluation_benchmark(
    request: EvaluationRunRequest = EvaluationRunRequest(),
    db: AsyncSession = Depends(get_db)
):
    """
    Executes the ground-truth aviation evaluation benchmark measuring Recall@K, MRR,
    citation precision, citation validity, and response latencies.
    """
    return await evaluation_service.run_benchmark(
        db=db,
        top_k=request.top_k,
        run_llm_answers=request.run_llm_answers
    )

@router.get("/latest", response_model=EvaluationReportResponse)
async def get_latest_evaluation_report():
    report = evaluation_service.get_latest_report()
    if not report:
        raise HTTPException(
            status_code=404,
            detail="No evaluation benchmark has been executed yet. Trigger a run via POST /api/evaluation/run."
        )
    return report

@router.get("/testcases")
async def get_evaluation_testcases():
    """Lists the 20 verified ground-truth test cases."""
    return {
        "total_test_cases": len(GROUND_TRUTH_BENCHMARK),
        "test_cases": GROUND_TRUTH_BENCHMARK
    }
