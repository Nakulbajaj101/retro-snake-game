def test_update_user_profile(client):
    # Register and login
    client.post(
        "/api/auth/register",
        json={"username": "profiletest", "password": "testpass123"}
    )
    login_response = client.post(
        "/api/auth/login",
        json={"username": "profiletest", "password": "testpass123"}
    )
    token = login_response.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Initial check
    response = client.get("/api/users/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "profiletest"
    assert data["theme_preference"] == "neon-green"  # Default

    # Update profile
    update_data = {
        "display_name": "Cool Player",
        "avatar": "avatar-1",
        "theme_preference": "cyber-punk"
    }
    response = client.put("/api/users/me", json=update_data, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["display_name"] == "Cool Player"
    assert data["avatar"] == "avatar-1"
    assert data["theme_preference"] == "cyber-punk"

    # Verify persistence
    response = client.get("/api/users/me", headers=headers)
    data = response.json()
    assert data["display_name"] == "Cool Player"
    assert data["theme_preference"] == "cyber-punk"


def test_update_partial_profile(client):
    # Register and login
    client.post(
        "/api/auth/register",
        json={"username": "partialtest", "password": "testpass123"}
    )
    login_response = client.post(
        "/api/auth/login",
        json={"username": "partialtest", "password": "testpass123"}
    )
    token = login_response.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Update only theme
    response = client.put(
        "/api/users/me", 
        json={"theme_preference": "retro-wave"}, 
        headers=headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["theme_preference"] == "retro-wave"
    assert data["display_name"] is None  # Should remain None
