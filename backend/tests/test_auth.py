"""
Automated Pytest Suite for User Account Creation & Retailer Profile Module.
Tests registration, validation, Argon2 hashing, JWT login, authentication, and profile update.
"""

import pytest
from datetime import datetime
from fastapi.testclient import TestClient
from app.main import app
from app.api import auth_routes
from app.services import auth_service

client = TestClient(app)
USER_STORE = {}
NEXT_USER_ID = 1


@pytest.fixture(autouse=True)
def fake_mongodb(monkeypatch):
    """Keep account endpoint tests isolated from any configured MongoDB server."""
    global NEXT_USER_ID
    USER_STORE.clear()
    NEXT_USER_ID = 1

    def find_by_email(email):
        return USER_STORE.get(email.strip().lower())

    def find_by_id(user_id):
        return next((user for user in USER_STORE.values() if user["id"] == user_id), None)

    def create_user(user_data):
        global NEXT_USER_ID
        user = {**user_data, "id": NEXT_USER_ID, "created_at": datetime.now()}
        NEXT_USER_ID += 1
        USER_STORE[user["email"]] = user
        return user

    def update_user(user_id, updates):
        user = find_by_id(user_id)
        if user:
            user.update(updates)
            user["updated_at"] = datetime.now()
        return user

    monkeypatch.setattr(auth_routes, "mongo_find_user_by_email", find_by_email)
    monkeypatch.setattr(auth_routes, "mongo_create_user", create_user)
    monkeypatch.setattr(auth_routes, "mongo_update_user", update_user)
    monkeypatch.setattr(auth_service, "mongo_find_user_by_id", find_by_id)
    yield
    USER_STORE.clear()


def test_register_valid_retailer():
    payload = {
        "full_name": "Asha Kumar",
        "email": "test.retailer@example.com",
        "phone": "+919876543210",
        "organization": "Asha Retail Pvt Ltd",
        "shop_name": "Asha Fashion Store",
        "business_type": "Clothing / fashion",
        "gst_number": "29ABCDE1234F1Z5",
        "address_line": "12 Market Road",
        "city": "Bengaluru",
        "state": "Karnataka",
        "pincode": "560001",
        "password": "SecurePassword123!",
        "confirm_password": "SecurePassword123!",
        "preferred_tone": "Premium",
    }
    response = client.post("/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test.retailer@example.com"
    assert data["shop_name"] == "Asha Fashion Store"
    assert data["business_type"] == "Clothing / fashion"
    assert "id" in data
    assert "password" not in data
    assert "password_hash" not in data

    user_db = USER_STORE["test.retailer@example.com"]
    assert user_db["password_hash"].startswith("$argon2")
    assert "SecurePassword123!" not in user_db["password_hash"]


def test_reject_duplicate_email():
    payload = {
        "full_name": "First User",
        "email": "duplicate.retailer@example.com",
        "phone": "9876543210",
        "shop_name": "First Shop",
        "business_type": "Retail shop",
        "password": "SecurePassword123!",
        "confirm_password": "SecurePassword123!",
    }
    r1 = client.post("/auth/register", json=payload)
    assert r1.status_code == 201

    # Second attempt with same email
    r2 = client.post("/auth/register", json=payload)
    assert r2.status_code == 409
    assert "already registered" in r2.json()["detail"].lower()


def test_reject_mismatched_password():
    payload = {
        "full_name": "Retailer User",
        "email": "test.retailer@example.com",
        "phone": "9876543210",
        "shop_name": "Retail Shop",
        "business_type": "Retail shop",
        "password": "SecurePassword123!",
        "confirm_password": "DifferentPassword456!",
    }
    response = client.post("/auth/register", json=payload)
    assert response.status_code == 422


def test_reject_short_password():
    payload = {
        "full_name": "Retailer User",
        "email": "test.retailer@example.com",
        "phone": "9876543210",
        "shop_name": "Retail Shop",
        "business_type": "Retail shop",
        "password": "short",
        "confirm_password": "short",
    }
    response = client.post("/auth/register", json=payload)
    assert response.status_code == 422


def test_reject_invalid_email_format():
    payload = {
        "full_name": "Retailer User",
        "email": "not-an-email",
        "phone": "9876543210",
        "shop_name": "Retail Shop",
        "business_type": "Retail shop",
        "password": "SecurePassword123!",
        "confirm_password": "SecurePassword123!",
    }
    response = client.post("/auth/register", json=payload)
    assert response.status_code == 422


def test_login_success_and_jwt_issuance():
    # Register user first
    payload = {
        "full_name": "Login Test User",
        "email": "test.retailer@example.com",
        "phone": "9876543210",
        "shop_name": "Quick Mart",
        "business_type": "Grocery / supermarket",
        "password": "LoginPassword123!",
        "confirm_password": "LoginPassword123!",
    }
    client.post("/auth/register", json=payload)

    # Login
    login_payload = {
        "email": "test.retailer@example.com",
        "password": "LoginPassword123!",
    }
    response = client.post("/auth/login", json=login_payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "test.retailer@example.com"
    assert data["user"]["shop_name"] == "Quick Mart"


def test_login_incorrect_password():
    payload = {
        "full_name": "Login Test User",
        "email": "test.retailer@example.com",
        "phone": "9876543210",
        "shop_name": "Quick Mart",
        "business_type": "Grocery / supermarket",
        "password": "LoginPassword123!",
        "confirm_password": "LoginPassword123!",
    }
    client.post("/auth/register", json=payload)

    # Login with wrong password
    login_payload = {
        "email": "test.retailer@example.com",
        "password": "WrongPassword999!",
    }
    response = client.post("/auth/login", json=login_payload)
    assert response.status_code == 401
    assert "invalid email or password" in response.json()["detail"].lower()


def test_protected_profile_endpoint():
    # 1. Accessing without token fails
    r_unauth = client.get("/auth/me")
    assert r_unauth.status_code == 401

    # 2. Register and login
    register_payload = {
        "full_name": "Profile Owner",
        "email": "update.retailer@example.com",
        "phone": "9876543210",
        "shop_name": "Tech Gadgets",
        "business_type": "Electronics",
        "password": "MySecretPassword123!",
        "confirm_password": "MySecretPassword123!",
        "preferred_tone": "Professional",
    }
    client.post("/auth/register", json=register_payload)

    login_resp = client.post("/auth/login", json={
        "email": "update.retailer@example.com",
        "password": "MySecretPassword123!",
    })
    token = login_resp.json()["access_token"]

    # 3. Access with token succeeds
    headers = {"Authorization": f"Bearer {token}"}
    r_profile = client.get("/auth/me", headers=headers)
    assert r_profile.status_code == 200
    user_data = r_profile.json()
    assert user_data["shop_name"] == "Tech Gadgets"
    assert user_data["preferred_tone"] == "Professional"

    # 4. Update profile details
    update_payload = {
        "shop_name": "Tech Superstore",
        "city": "Hyderabad",
        "preferred_tone": "Premium",
    }
    r_update = client.patch("/auth/me", json=update_payload, headers=headers)
    assert r_update.status_code == 200
    updated_data = r_update.json()
    assert updated_data["shop_name"] == "Tech Superstore"
    assert updated_data["city"] == "Hyderabad"
    assert updated_data["preferred_tone"] == "Premium"


def test_mongodb_authentication_and_profile_update(monkeypatch):
    from app.api import auth_routes
    from app.services import auth_service

    user_store = {}

    def find_by_email(email):
        return user_store.get(email)

    def create_user(user_data):
        user = {**user_data, "id": 101}
        user["created_at"] = datetime.now()
        user_store[user["email"]] = user
        return user

    def find_by_id(user_id):
        return next((user for user in user_store.values() if user["id"] == user_id), None)

    def update_user(user_id, updates):
        user = find_by_id(user_id)
        if user:
            user.update(updates)
        return user

    monkeypatch.setattr(auth_routes, "mongo_find_user_by_email", find_by_email)
    monkeypatch.setattr(auth_routes, "mongo_create_user", create_user)
    monkeypatch.setattr(auth_routes, "mongo_update_user", update_user)
    monkeypatch.setattr(auth_service, "mongo_find_user_by_id", find_by_id)

    payload = {
        "full_name": "Mongo Retailer",
        "email": "mongo.retailer@example.com",
        "phone": "9876543210",
        "shop_name": "Mongo Shop",
        "business_type": "Retail shop",
        "password": "SecurePassword123!",
        "confirm_password": "SecurePassword123!",
    }
    registration = client.post("/auth/register", json=payload)
    assert registration.status_code == 201
    assert registration.json()["id"] == 101

    login = client.post(
        "/auth/login",
        json={"email": payload["email"], "password": payload["password"]},
    )
    assert login.status_code == 200
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    profile = client.patch("/auth/me", json={"shop_name": "Updated Mongo Shop"}, headers=headers)
    assert profile.status_code == 200
    assert profile.json()["shop_name"] == "Updated Mongo Shop"
