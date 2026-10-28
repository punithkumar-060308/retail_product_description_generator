"""
Pydantic schemas for user registration, authentication, and business profile management.
Enforces strict field validation, password confirmation, and format checks according to the spec.
"""

import re
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator, model_validator, ConfigDict

VALID_BUSINESS_TYPES = [
    "Retail shop",
    "Grocery / supermarket",
    "Clothing / fashion",
    "Electronics",
    "Pharmacy",
    "Home / furniture",
    "Beauty / personal care",
    "Wholesale / distributor",
    "Online store",
    "Other",
]

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")
GSTIN_REGEX = re.compile(r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$")
PINCODE_REGEX = re.compile(r"^\d{6}$")
PHONE_REGEX = re.compile(r"^\+?[0-9\s\-]{8,18}$")


class UserRegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=1, description="Retailer full name (required)")
    email: str = Field(..., min_length=5, description="Valid unique login email address (required)")
    phone: str = Field(..., min_length=7, description="Contact phone number (required)")
    organization: Optional[str] = Field(default=None, description="Company or organization name")
    shop_name: str = Field(..., min_length=1, description="Retail shop or storefront name (required)")
    business_type: str = Field(..., description="Category of retail business (required)")
    gst_number: Optional[str] = Field(default=None, description="GSTIN (optional)")
    address_line: Optional[str] = Field(default=None, description="Street address")
    city: Optional[str] = Field(default=None, description="City / town")
    state: Optional[str] = Field(default=None, description="State / union territory")
    pincode: Optional[str] = Field(default=None, description="6-digit PIN code (optional)")
    password: str = Field(..., min_length=8, description="Account password (min 8 characters)")
    confirm_password: str = Field(..., min_length=8, description="Password confirmation")
    preferred_tone: Optional[str] = Field(default="Friendly", description="Default copywriting tone")

    @field_validator("full_name", "shop_name")
    @classmethod
    def validate_not_blank(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Field cannot be empty or blank whitespace.")
        return stripped

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        cleaned = v.strip().lower()
        if not EMAIL_REGEX.match(cleaned):
            raise ValueError("Invalid email address format.")
        return cleaned

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        cleaned = v.strip()
        if not PHONE_REGEX.match(cleaned):
            raise ValueError("Invalid phone number format. Provide 8 to 15 numeric digits.")
        return cleaned

    @field_validator("business_type")
    @classmethod
    def validate_business_type(cls, v: str) -> str:
        cleaned = v.strip()
        for btype in VALID_BUSINESS_TYPES:
            if cleaned.lower() == btype.lower():
                return btype
        return cleaned or "Retail shop"

    @field_validator("gst_number")
    @classmethod
    def validate_gst(cls, v: Optional[str]) -> Optional[str]:
        if not v or not v.strip():
            return None
        cleaned = v.strip().upper()
        if not GSTIN_REGEX.match(cleaned):
            raise ValueError("Invalid GSTIN format. Expected standard 15-character format (e.g. 29ABCDE1234F1Z5).")
        return cleaned

    @field_validator("pincode")
    @classmethod
    def validate_pincode(cls, v: Optional[str]) -> Optional[str]:
        if not v or not v.strip():
            return None
        cleaned = v.strip()
        if not PINCODE_REGEX.match(cleaned):
            raise ValueError("Invalid PIN code format. Expected 6 digits (e.g. 560001).")
        return cleaned

    @model_validator(mode="after")
    def check_passwords_match(self):
        if self.password != self.confirm_password:
            raise ValueError("Password and Confirm Password do not match.")
        return self


class UserLoginRequest(BaseModel):
    email: str = Field(..., min_length=5, description="Registered login email")
    password: str = Field(..., min_length=1, description="Account password")

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        cleaned = v.strip().lower()
        if not EMAIL_REGEX.match(cleaned):
            raise ValueError("Invalid email address format.")
        return cleaned


class UserUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    organization: Optional[str] = None
    shop_name: Optional[str] = None
    business_type: Optional[str] = None
    gst_number: Optional[str] = None
    address_line: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    preferred_tone: Optional[str] = None

    @field_validator("gst_number")
    @classmethod
    def validate_gst(cls, v: Optional[str]) -> Optional[str]:
        if not v or not v.strip():
            return None
        cleaned = v.strip().upper()
        if not GSTIN_REGEX.match(cleaned):
            raise ValueError("Invalid GSTIN format.")
        return cleaned

    @field_validator("pincode")
    @classmethod
    def validate_pincode(cls, v: Optional[str]) -> Optional[str]:
        if not v or not v.strip():
            return None
        cleaned = v.strip()
        if not PINCODE_REGEX.match(cleaned):
            raise ValueError("Invalid PIN code format. Expected 6 digits.")
        return cleaned


class UserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    phone: str
    organization: Optional[str] = None
    shop_name: str
    business_type: str
    gst_number: Optional[str] = None
    address_line: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    preferred_tone: Optional[str] = "Friendly"
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
