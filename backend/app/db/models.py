"""
Database models for user accounts and retail business profiles.
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    full_name = Column(String(120), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(30), nullable=False)
    organization = Column(String(200), nullable=True)
    shop_name = Column(String(200), nullable=False)
    business_type = Column(String(100), nullable=False)
    gst_number = Column(String(30), nullable=True)
    address_line = Column(String(255), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    pincode = Column(String(20), nullable=True)
    password_hash = Column(String(255), nullable=False)
    preferred_tone = Column(String(50), nullable=True, default="Friendly")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<User id={self.id} email='{self.email}' shop='{self.shop_name}'>"
