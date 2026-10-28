"""
Pydantic schemas for the Retail Product Description Generator.
Defines input validation, output models, batch schemas, and feedback evaluation models.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator


class ProductInput(BaseModel):
    product_id: Optional[str] = Field(default=None, description="Unique product SKU or ID")
    name: str = Field(..., min_length=1, description="Product title/name (required)")
    category: Optional[str] = Field(default="General", description="Product category")
    features: str = Field(..., min_length=1, description="Product features, facts, and selling points")
    audience: Optional[str] = Field(default="General consumers", description="Target customer audience")
    price: Optional[str] = Field(default=None, description="Product price or price string")
    currency: Optional[str] = Field(default="INR", description="Currency code (e.g. INR, USD, EUR)")
    tone: str = Field(default="Friendly", description="Desired copywriting tone")
    keywords: Optional[str] = Field(default="", description="Optional seed keywords for SEO")
    specifications: Optional[str] = Field(default="", description="Structured technical specifications")
    brand: Optional[str] = Field(default="", description="Brand name if applicable")

    @field_validator("name")
    @classmethod
    def validate_name_not_empty(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Product name cannot be empty or pure whitespace.")
        return stripped

    @field_validator("features")
    @classmethod
    def validate_features_not_empty(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Product features cannot be empty. Verified facts are required to ground copy.")
        return stripped

    @field_validator("tone")
    @classmethod
    def validate_tone(cls, v: str) -> str:
        valid_tones = ["Friendly", "Professional", "Premium", "Minimal", "Urgent / Persuasive", "Playful"]
        # Allow case-insensitive matching
        for tone in valid_tones:
            if v.strip().lower() == tone.lower():
                return tone
        return v.strip().title()


class ProductOutput(BaseModel):
    product_id: Optional[str] = None
    name: str
    category: Optional[str] = None
    tone: str
    short_description: str = Field(..., description="1-2 sentence punchy overview")
    description: str = Field(..., description="Rich, 2-3 paragraph detailed customer copy")
    seo_keywords: List[str] = Field(default_factory=list, description="4-8 SEO keywords")
    meta_description: str = Field(..., description="Search snippet <= 160 characters")
    generation_mode: str = Field(
        ..., description="Indicates 'gemini-llm' or 'grounded-fallback' for transparent provenance"
    )
    meta_char_count: int = Field(default=0, description="Length of meta description in characters")
    warnings: List[str] = Field(default_factory=list, description="Quality or grounding check notices")


class BatchItemError(BaseModel):
    row_index: int
    product_name: Optional[str] = None
    error: str


class BatchResponse(BaseModel):
    total_rows: int
    processed_count: int
    success_count: int
    error_count: int
    results: List[ProductOutput]
    errors: List[BatchItemError]
    execution_time_seconds: float
    generation_mode_summary: Dict[str, int]


class FeedbackInput(BaseModel):
    product_name: str
    tone: str
    rating_factual_accuracy: int = Field(..., ge=1, le=5, description="1-5 rating: Claims match input facts")
    rating_relevance: int = Field(..., ge=1, le=5, description="1-5 rating: Copy is appropriate to product")
    rating_creativity: int = Field(..., ge=1, le=5, description="1-5 rating: Engaging without false claims")
    rating_readability: int = Field(..., ge=1, le=5, description="1-5 rating: Clear, natural, well structured")
    rating_seo_quality: int = Field(..., ge=1, le=5, description="1-5 rating: Natural keywords and meta snippet")
    rating_tone_consistency: int = Field(..., ge=1, le=5, description="1-5 rating: Aligns with chosen voice")
    comments: Optional[str] = Field(default="", description="Human reviewer notes")
    generation_mode: Optional[str] = "gemini-llm"


class FeedbackRecord(FeedbackInput):
    id: str
    created_at: str
    overall_percentage: float
