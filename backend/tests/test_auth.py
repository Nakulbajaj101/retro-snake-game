def test_register_user(client):
    response = client.post(
        "/api/auth/register",
        json={"username": "testuser", "password": "testpass123"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["username"] == "testuser"
    assert "id" in data
    assert "created_at" in data


def test_register_duplicate_username(client):
    # Register first user
    client.post(
        "/api/auth/register",
        json={"username": "testuser", "password": "testpass123"}
    )
    
    # Try to register with same username
    response = client.post(
        "/api/auth/register",
        json={"username": "testuser", "password": "anotherpass123"}
    )
    assert response.status_code == 409
    assert "already exists" in response.json()["detail"].lower()


def test_register_short_username(client):
    response = client.post(
        "/api/auth/register",
        json={"username": "ab", "password": "testpass123"}
    )
    assert response.status_code == 422


def test_register_short_password(client):
    response = client.post(
        "/api/auth/register",
        json={"username": "testuser", "password": "short"}
    )
    assert response.status_code == 422


def test_login_success(client):
    # Register user first
    client.post(
        "/api/auth/register",
        json={"username": "testuser", "password": "testpass123"}
    )
    
    # Login
    response = client.post(
        "/api/auth/login",
        json={"username": "testuser", "password": "testpass123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "token" in data
    assert data["user"]["username"] == "testuser"


def test_login_invalid_credentials(client):
    # Register user first
    client.post(
        "/api/auth/register",
        json={"username": "testuser", "password": "testpass123"}
    )
    
    # Try login with wrong password
    response = client.post(
        "/api/auth/login",
        json={"username": "testuser", "password": "wrongpass"}
    )
    assert response.status_code == 401


def test_login_nonexistent_user(client):
    response = client.post(
        "/api/auth/login",
        json={"username": "nonexistent", "password": "testpass123"}
    )
    assert response.status_code == 401
