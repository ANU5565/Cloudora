import pytest


def test_register_and_login(client):
    # 1. Register new user
    reg_payload = {
        "email": "alice@cloudora.io",
        "full_name": "Alice Wonderland",
        "password": "Password123!",
        "confirm_password": "Password123!",
        "terms_accepted": True
    }
    res = client.post("/api/v1/auth/register", json=reg_payload)
    assert res.status_code == 200, res.text
    user_data = res.json()
    assert user_data["email"] == "alice@cloudora.io"
    assert user_data["full_name"] == "Alice Wonderland"
    assert "hashed_password" not in user_data

    # 2. Duplicate registration should fail
    dup_res = client.post("/api/v1/auth/register", json=reg_payload)
    assert dup_res.status_code == 409

    # 3. Login with correct password
    login_res = client.post("/api/v1/auth/login", json={
        "email": "alice@cloudora.io",
        "password": "Password123!"
    })
    assert login_res.status_code == 200
    token_data = login_res.json()
    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"
    token = token_data["access_token"]

    # 4. Access protected profile
    me_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "alice@cloudora.io"

    # 5. Login with invalid password should fail
    bad_login = client.post("/api/v1/auth/login", json={
        "email": "alice@cloudora.io",
        "password": "WrongPassword!"
    })
    assert bad_login.status_code == 401
