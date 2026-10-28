"""
FastAPI route handlers for user registration, authentication, and profile management.
Implements the endpoints specified in user_account_creation_implementation.md:
- POST  /auth/register
- POST  /auth/login
- GET   /auth/me
- PATCH /auth/me
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..db.database import get_db
from ..db.models import User
from ..schemas.user import (
    UserRegisterRequest,
    UserLoginRequest,
    UserUpdateRequest,
    UserResponse,
    TokenResponse,
)
from ..services.auth_service import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
)

auth_router = APIRouter(prefix="/auth", tags=["Authentication & Retailer Profile"])


@auth_router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new retailer account and business profile",
)
def register_user(req: UserRegisterRequest, db: Session = Depends(get_db)):
    """
    Validate and create a retailer account:
    - Verifies field formats and password match
    - Checks for existing email address (409 Conflict)
    - Hashes password with Argon2
    - Persists user and shop details
    - Returns safe user representation (no password hash)
    """
    normalized_email = req.email.strip().lower()

    # 1. Check if email already registered
    existing_user = db.query(User).filter(User.email == normalized_email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email address is already registered.",
        )

    # 2. Hash password with Argon2
    hashed_pwd = hash_password(req.password)

    # 3. Create user entity
    new_user = User(
        full_name=req.full_name.strip(),
        email=normalized_email,
        phone=req.phone.strip(),
        organization=req.organization.strip() if req.organization else None,
        shop_name=req.shop_name.strip(),
        business_type=req.business_type,
        gst_number=req.gst_number,
        address_line=req.address_line.strip() if req.address_line else None,
        city=req.city.strip() if req.city else None,
        state=req.state.strip() if req.state else None,
        pincode=req.pincode,
        password_hash=hashed_pwd,
        preferred_tone=req.preferred_tone or "Friendly",
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@auth_router.post(
    "/login",
    response_model=TokenResponse,
    summary="Authenticate retailer and issue JWT access token",
)
def login_user(req: UserLoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate retailer with email and password:
    - Finds user by email
    - Verifies password against stored Argon2 hash
    - Generates signed JWT bearer token
    """
    normalized_email = req.email.strip().lower()
    user = db.query(User).filter(User.email == normalized_email).first()

    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(user_id=user.id, email=user.email)

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@auth_router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current signed-in retailer profile",
)
def get_profile(current_user: User = Depends(get_current_user)):
    """Returns the authenticated retailer's business profile and account details."""
    return current_user


@auth_router.patch(
    "/me",
    response_model=UserResponse,
    summary="Update retailer profile and shop settings",
)
def update_profile(
    updates: UserUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update allowlisted profile and business details:
    - Modifies only permitted fields
    - Persists changes to SQLite database
    - Returns updated profile
    """
    update_data = updates.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        if value is not None:
            if isinstance(value, str):
                value = value.strip()
            setattr(current_user, field, value)

    db.commit()
    db.refresh(current_user)
    return current_user
