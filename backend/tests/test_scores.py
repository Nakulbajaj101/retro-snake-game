def test_get_leaderboard_empty(client):
    response = client.get("/api/scores")
    assert response.status_code == 200
    assert response.json() == []


def test_submit_score_unauthorized(client):
    response = client.post(
        "/api/scores",
        json={"score": 100}
    )
    assert response.status_code == 401


def test_submit_score_success(client):
    # Register and login
    client.post(
        "/api/auth/register",
        json={"username": "testuser", "password": "testpass123"}
    )
    login_response = client.post(
        "/api/auth/login",
        json={"username": "testuser", "password": "testpass123"}
    )
    token = login_response.json()["token"]
    
    # Submit score
    response = client.post(
        "/api/scores",
        json={"score": 150},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["score"] == 150
    assert data["username"] == "testuser"


def test_get_leaderboard_with_scores(client):
    # Register and login two users
    client.post(
        "/api/auth/register",
        json={"username": "user1", "password": "testpass123"}
    )
    login1 = client.post(
        "/api/auth/login",
        json={"username": "user1", "password": "testpass123"}
    )
    token1 = login1.json()["token"]
    
    client.post(
        "/api/auth/register",
        json={"username": "user2", "password": "testpass123"}
    )
    login2 = client.post(
        "/api/auth/login",
        json={"username": "user2", "password": "testpass123"}
    )
    token2 = login2.json()["token"]
    
    # Submit scores
    client.post(
        "/api/scores",
        json={"score": 100},
        headers={"Authorization": f"Bearer {token1}"}
    )
    client.post(
        "/api/scores",
        json={"score": 200},
        headers={"Authorization": f"Bearer {token2}"}
    )
    
    # Get leaderboard
    response = client.get("/api/scores")
    assert response.status_code == 200
    scores = response.json()
    assert len(scores) == 2
    # Should be sorted by score descending
    assert scores[0]["score"] == 200
    assert scores[1]["score"] == 100


def test_submit_negative_score(client):
    # Register and login
    client.post(
        "/api/auth/register",
        json={"username": "testuser", "password": "testpass123"}
    )
    login_response = client.post(
        "/api/auth/login",
        json={"username": "testuser", "password": "testpass123"}
    )
    token = login_response.json()["token"]
    
    # Try to submit negative score
    response = client.post(
        "/api/scores",
        json={"score": -10},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 422


def test_leaderboard_limit(client):
    # Register and login
    client.post(
        "/api/auth/register",
        json={"username": "testuser", "password": "testpass123"}
    )
    login_response = client.post(
        "/api/auth/login",
        json={"username": "testuser", "password": "testpass123"}
    )
    token = login_response.json()["token"]
    
    # Submit multiple scores
    for i in range(15):
        client.post(
            "/api/scores",
            json={"score": i * 10},
            headers={"Authorization": f"Bearer {token}"}
        )
    
    # Get leaderboard with limit
    response = client.get("/api/scores?limit=5")
    assert response.status_code == 200
    scores = response.json()
    assert len(scores) == 5
