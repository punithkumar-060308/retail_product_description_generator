"""
Automated Pytest Suite for Retail Product Description Generator.
Tests validation, generation, tones, batch processing (50+ items), error handling, and export.
"""

import io
from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.schemas.product import ProductInput
from app.services.generation import generation_service

client = TestClient(app)


def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "service" in data
    assert "endpoints" in data


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "provider" in data
    assert "llm_configured" in data


def test_single_product_valid_generation():
    payload = {
        "product_id": "TEST01",
        "name": "Zenith Pour-Over Gooseneck Kettle",
        "category": "Kitchen",
        "features": "Precision flow spout, Built-in thermometer, 1.2L capacity, Food-grade stainless steel",
        "audience": "Home baristas and coffee enthusiasts",
        "price": "2199",
        "currency": "INR",
        "tone": "Friendly",
        "keywords": "pour over kettle, barista drip kettle",
    }
    response = client.post("/generate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == payload["name"]
    assert len(data["short_description"]) > 10
    assert len(data["description"]) > 30
    assert len(data["meta_description"]) <= 165
    assert len(data["seo_keywords"]) >= 2
    assert data["generation_mode"] in ["gemini-llm", "grounded-fallback"]


@pytest.mark.parametrize("tone", ["Friendly", "Professional", "Premium", "Minimal", "Urgent / Persuasive"])
def test_generation_tones(tone):
    payload = {
        "name": "PulseFit Pro Smartwatch",
        "category": "Electronics",
        "features": "Heart rate & SpO2 tracking, 14-day battery life, 5ATM water resistance",
        "tone": tone,
    }
    response = client.post("/generate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["tone"] == tone


def test_missing_product_name_validation_error():
    payload = {
        "name": "   ",  # whitespace only
        "features": "Great feature",
    }
    response = client.post("/generate", json=payload)
    assert response.status_code == 422


def test_empty_features_validation_error():
    payload = {
        "name": "Wireless Headphones",
        "features": "",
    }
    response = client.post("/generate", json=payload)
    assert response.status_code == 422


def test_batch_upload_with_sample_50_products():
    sample_csv = Path(__file__).resolve().parent.parent.parent / "data" / "sample_products.csv"
    assert sample_csv.exists(), "sample_products.csv must exist in data directory"

    with open(sample_csv, "rb") as f:
        file_bytes = f.read()

    files = {"file": ("sample_products.csv", file_bytes, "text/csv")}
    response = client.post("/generate-batch", files=files, data={"default_tone": "Professional"})

    assert response.status_code == 200
    data = response.json()
    assert data["total_rows"] >= 50
    assert data["success_count"] >= 50
    assert data["error_count"] == 0
    assert len(data["results"]) >= 50
    assert data["execution_time_seconds"] >= 0


def test_batch_upload_invalid_csv_missing_name():
    csv_content = b"sku,category,features\nP10,Tools,Heavy duty steel"
    files = {"file": ("bad_headers.csv", io.BytesIO(csv_content), "text/csv")}
    response = client.post("/generate-batch", files=files)
    assert response.status_code == 400
    assert "missing required 'name' column" in response.json()["detail"].lower()


def test_batch_upload_empty_csv():
    files = {"file": ("empty.csv", io.BytesIO(b""), "text/csv")}
    response = client.post("/generate-batch", files=files)
    assert response.status_code == 400


def test_csv_export_endpoint():
    dummy_products = [
        {
            "product_id": "P01",
            "name": "Noise Cancelling Headphones",
            "category": "Electronics",
            "tone": "Premium",
            "short_description": "Exceptional audio with premium memory foam.",
            "description": "Engineered for pure tranquility, these headphones elevate your listening journey.",
            "seo_keywords": ["anc headphones", "wireless audio"],
            "meta_description": "Discover exceptional sound with our active noise cancelling headphones.",
            "generation_mode": "grounded-fallback",
            "meta_char_count": 68,
            "warnings": [],
        }
    ]
    response = client.post("/export-csv", json=dummy_products)
    assert response.status_code == 200
    assert "text/csv" in response.headers["content-type"]
    assert "Noise Cancelling Headphones" in response.text
    assert "short_description" in response.text


def test_feedback_submission_and_rubric():
    feedback_payload = {
        "product_name": "AuraWave Headphones",
        "tone": "Premium",
        "rating_factual_accuracy": 5,
        "rating_relevance": 5,
        "rating_creativity": 4,
        "rating_readability": 5,
        "rating_seo_quality": 4,
        "rating_tone_consistency": 5,
        "comments": "Grounding was strictly preserved without inventing specs.",
        "generation_mode": "grounded-fallback",
    }
    response = client.post("/feedback", json=feedback_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["overall_percentage"] == round((28 / 30.0) * 100, 1)

    # Check listing
    list_response = client.get("/feedback")
    assert list_response.status_code == 200
    records = list_response.json()
    assert len(records) >= 1
    assert records[0]["product_name"] == "AuraWave Headphones"
