"""
FastAPI REST API routes for Retail Product Description Generator.
Provides single generation, batch CSV generation, export, feedback recording, and health checks.
"""

import uuid
import datetime
from pathlib import Path
from typing import List
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Response
from fastapi.responses import PlainTextResponse
from pymongo.errors import PyMongoError

from ..db.mongo import (
    mongo_count_feedbacks,
    mongo_list_feedbacks,
    mongo_save_feedback,
    ping_mongo,
)
from ..schemas.product import (
    ProductInput,
    ProductOutput,
    BatchResponse,
    FeedbackInput,
    FeedbackRecord,
)
from ..services.generation import generation_service
from ..services.csv_service import csv_service

router = APIRouter()

SAMPLE_CSV_PATH = Path(__file__).resolve().parent.parent.parent.parent / "data" / "sample_products.csv"


@router.get("/")
def root():
    """API welcome and documentation pointer."""
    return {
        "service": "Retail Product Description Generator API",
        "version": "1.0.0",
        "documentation": "/docs",
        "health": "/health",
        "endpoints": {
            "generate_single": "POST /generate",
            "generate_batch": "POST /generate-batch",
            "export_csv": "POST /export-csv",
            "sample_catalog": "GET /sample-catalog",
            "feedback": "POST /feedback, GET /feedback",
        },
    }


@router.get("/health")
def health_check():
    """Health check reporting provider status without exposing secrets."""
    has_key = generation_service.is_llm_configured()
    model = generation_service.model_name
    health = {
        "status": "healthy",
        "provider": "Google Gemini" if has_key else "Grounded Fallback Engine",
        "model": model if has_key else "deterministic-rule-grounded",
        "llm_configured": has_key,
        "sample_data_available": SAMPLE_CSV_PATH.exists(),
        "total_evaluations_recorded": 0,
        "database": {"provider": "MongoDB"},
    }
    connection = ping_mongo()
    health["database"]["connected"] = connection["connected"]
    if connection["connected"]:
        health["database"]["name"] = connection["db_name"]
        try:
            health["total_evaluations_recorded"] = mongo_count_feedbacks()
        except PyMongoError:
            health["status"] = "degraded"
    else:
        health["status"] = "degraded"
    return health


@router.post("/generate", response_model=ProductOutput)
def generate_single_product(product: ProductInput):
    """
    Generate compelling, SEO-optimized copy for a single retail product.
    Rely strictly on supplied facts to avoid unsupported claims.
    """
    try:
        output = generation_service.generate(product)
        return output
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")


@router.post("/generate-batch", response_model=BatchResponse)
async def generate_batch_from_csv(
    file: UploadFile = File(...),
    default_tone: str = Form("Friendly"),
):
    """
    Upload a CSV catalog (supports 50+ products) and generate descriptions in bulk.
    Validates headers and skips/records invalid rows transparently.
    """
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a .csv file.")

    content = await file.read()
    if len(content) > 10 * 1024 * 1024:  # 10MB limit
        raise HTTPException(status_code=400, detail="File too large. Maximum supported size is 10MB.")

    try:
        batch_response = csv_service.parse_and_process_csv(content, default_tone=default_tone)
        return batch_response
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch processing failed: {str(e)}")


@router.get("/sample-catalog", response_class=PlainTextResponse)
def get_sample_catalog():
    """Returns the bundled 55-product CSV catalog for instant 1-click UI testing."""
    if not SAMPLE_CSV_PATH.exists():
        raise HTTPException(status_code=404, detail="Sample catalog file not found on server.")
    with open(SAMPLE_CSV_PATH, "r", encoding="utf-8") as f:
        return f.read()


@router.post("/export-csv")
def export_descriptions_csv(results: List[ProductOutput]):
    """Download generated product copy as a clean, compliant CSV file."""
    if not results:
        raise HTTPException(status_code=400, detail="No product descriptions provided for export.")

    csv_data = csv_service.export_to_csv(results)
    filename = f"product_descriptions_{datetime.date.today().isoformat()}.csv"

    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/feedback", response_model=FeedbackRecord)
def submit_evaluation_feedback(feedback: FeedbackInput):
    """
    Record human quality evaluation scores against the six defined rubric criteria:
    Factual Accuracy, Relevance, Creativity, Readability, SEO Quality, Tone Consistency.
    """
    # 6 criteria with 1-5 scale. Max total = 30 points.
    total_score = (
        feedback.rating_factual_accuracy
        + feedback.rating_relevance
        + feedback.rating_creativity
        + feedback.rating_readability
        + feedback.rating_seo_quality
        + feedback.rating_tone_consistency
    )
    percentage = round((total_score / 30.0) * 100, 1)

    record = FeedbackRecord(
        id=str(uuid.uuid4())[:8],
        created_at=datetime.datetime.now().strftime("%Y-%m-%d %H:%M"),
        product_name=feedback.product_name,
        tone=feedback.tone,
        rating_factual_accuracy=feedback.rating_factual_accuracy,
        rating_relevance=feedback.rating_relevance,
        rating_creativity=feedback.rating_creativity,
        rating_readability=feedback.rating_readability,
        rating_seo_quality=feedback.rating_seo_quality,
        rating_tone_consistency=feedback.rating_tone_consistency,
        comments=feedback.comments,
        generation_mode=feedback.generation_mode,
        overall_percentage=percentage,
    )

    try:
        mongo_save_feedback(record.model_dump())
    except PyMongoError as exc:
        raise HTTPException(
            status_code=503,
            detail="MongoDB is unavailable; verify the database connection.",
        ) from exc
    return record


@router.get("/feedback", response_model=List[FeedbackRecord])
def list_evaluations():
    """List all recorded quality rubric reviews and evaluation scores."""
    try:
        return mongo_list_feedbacks()
    except PyMongoError as exc:
        raise HTTPException(
            status_code=503,
            detail="MongoDB is unavailable; verify the database connection.",
        ) from exc
