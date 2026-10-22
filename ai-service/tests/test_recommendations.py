import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.config import get_settings

settings = get_settings()
client = TestClient(app)

VALID_TOKEN = settings.AI_SERVICE_TOKEN
AUTH_HEADERS = {"Authorization": f"Bearer {VALID_TOKEN}"}
X_AUTH_HEADERS = {"X-AI-Service-Token": VALID_TOKEN}


# Sample book catalog fixtures
SAMPLE_CANDIDATES = [
    {
        "_id": "book_1",
        "title": "Cosmic Horizons: Observational Astrophysics",
        "author": "Dr. Alistair Finch",
        "genre": "Astrophysics",
        "category": "Science & Technology",
        "description": "Comprehensive telescopic observations of remote quasars and celestial radiation.",
        "ISBN": "978-0-1431-8841-2",
        "availableCopies": 5,
        "totalCopies": 5,
        "rating": 4.9,
    },
    {
        "_id": "book_2",
        "title": "Quantum Mechanics & Superstring Dynamics",
        "author": "Prof. Elena Rostova",
        "genre": "Astrophysics",
        "category": "Science & Technology",
        "description": "Theoretical physics explorations into dimensional manifolds and quantum gravity.",
        "ISBN": "978-0-4821-3901-5",
        "availableCopies": 0,
        "totalCopies": 3,
        "rating": 4.7,
    },
    {
        "_id": "book_3",
        "title": "The Architecture of Silence",
        "author": "Helena Vance",
        "genre": "Architecture & Design",
        "category": "Architecture",
        "description": "Exploration of sacred brutalist sanctuaries and contemplative stone monuments.",
        "ISBN": "978-1-5932-7491-0",
        "availableCopies": 4,
        "totalCopies": 4,
        "rating": 4.8,
    },
    {
        "_id": "book_4",
        "title": "Echoes in Pale Stone",
        "author": "Arto Nieminen",
        "genre": "Speculative Fiction",
        "category": "Literary Fiction",
        "description": "An architectural surveyor discovers an abandoned monolithic granite observatory.",
        "ISBN": "978-0-8129-9354-7",
        "availableCopies": 2,
        "totalCopies": 2,
        "rating": 4.6,
    },
    {
        "_id": "book_5",
        "title": "Modernist Urbanism and Concrete Forms",
        "author": "Helena Vance",
        "genre": "Architecture & Design",
        "category": "Architecture",
        "description": "Civic planning, brutalism, and monumental concrete forms in postwar Europe.",
        "ISBN": "978-0-3995-9050-4",
        "availableCopies": 3,
        "totalCopies": 3,
        "rating": 4.5,
    },
]


# ============================================================================
# 1. HEALTH AND DIAGNOSTICS
# ============================================================================
def test_health_check_returns_healthy():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == settings.SERVICE_NAME
    assert data["version"] == settings.SERVICE_VERSION
    assert "timestamp" in data
    assert data["environment"] == settings.ENVIRONMENT


def test_root_landing_returns_ok():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "documentation" in data


# ============================================================================
# 2. SERVICE-TO-SERVICE AUTHENTICATION
# ============================================================================
def test_recommendations_rejects_missing_token():
    payload = {"candidate_books": SAMPLE_CANDIDATES}
    response = client.post("/api/recommendations", json=payload)
    assert response.status_code == 401
    assert response.json()["detail"]["error"]["code"] == "MISSING_SERVICE_TOKEN"


def test_recommendations_rejects_invalid_bearer_token():
    payload = {"candidate_books": SAMPLE_CANDIDATES}
    response = client.post(
        "/api/recommendations",
        headers={"Authorization": "Bearer invalid_secret_token_123"},
        json=payload,
    )
    assert response.status_code == 401
    assert response.json()["detail"]["error"]["code"] == "INVALID_SERVICE_TOKEN"


def test_recommendations_accepts_valid_bearer_token():
    payload = {"candidate_books": SAMPLE_CANDIDATES}
    response = client.post(
        "/api/recommendations",
        headers=AUTH_HEADERS,
        json=payload,
    )
    assert response.status_code == 200
    assert response.json()["success"] is True


def test_recommendations_accepts_valid_custom_header():
    payload = {"candidate_books": SAMPLE_CANDIDATES}
    response = client.post(
        "/api/recommendations",
        headers=X_AUTH_HEADERS,
        json=payload,
    )
    assert response.status_code == 200
    assert response.json()["success"] is True


# ============================================================================
# 3. COLD-START FALLBACK RECOMMENDATIONS
# ============================================================================
def test_cold_start_when_user_history_and_preferences_are_empty():
    payload = {
        "candidate_books": SAMPLE_CANDIDATES,
        "borrowed_books": [],
        "favorite_books": [],
        "recently_viewed_books": [],
        "preferences": {
            "favorite_genres": [],
            "favorite_categories": [],
            "favorite_authors": [],
        },
        "limit": 3,
    }

    response = client.post("/api/recommendations", headers=AUTH_HEADERS, json=payload)
    assert response.status_code == 200
    body = response.json()

    assert body["success"] is True
    assert body["is_personalized"] is False
    assert body["strategy"] == "cold_start_popular"
    assert len(body["data"]) == 3

    # Every item must have an explainable reason and valid score
    for item in body["data"]:
        assert 0.0 <= item["score"] <= 1.0
        assert len(item["reason"]) > 10
        assert item["book"]["id"] in [b["_id"] for b in SAMPLE_CANDIDATES]

    # Verify highest rated available books appear first
    first_pick = body["data"][0]["book"]
    assert first_pick["rating"] >= 4.8
    assert first_pick["availableCopies"] > 0


# ============================================================================
# 4. PERSONALIZED RECOMMENDATIONS (GENRE, CATEGORY & AUTHOR AFFINITY)
# ============================================================================
def test_personalized_recommendation_based_on_borrowed_history():
    # User previously borrowed an Astrophysics book by Dr. Alistair Finch
    payload = {
        "candidate_books": SAMPLE_CANDIDATES,
        "borrowed_books": [
            {
                "_id": "past_book_99",
                "title": "Early Stellar Formations",
                "author": "Dr. Alistair Finch",
                "genre": "Astrophysics",
                "category": "Science & Technology",
                "description": "Studies of interstellar matter and stellar nucleosynthesis.",
                "availableCopies": 2,
                "totalCopies": 2,
                "rating": 4.8,
            }
        ],
        "limit": 3,
    }

    response = client.post("/api/recommendations", headers=AUTH_HEADERS, json=payload)
    assert response.status_code == 200
    body = response.json()

    assert body["success"] is True
    assert body["is_personalized"] is True
    assert body["strategy"] == "personalized_content_based"
    assert len(body["data"]) > 0

    # Book 1 should be the top match because it shares the same Author and Genre
    top_rec = body["data"][0]
    assert top_rec["book"]["id"] == "book_1"
    assert top_rec["matched_genre"] == "Astrophysics"
    assert top_rec["matched_author"] == "Dr. Alistair Finch"
    assert top_rec["score"] > 0.60
    assert "Alistair Finch" in top_rec["reason"] or "Astrophysics" in top_rec["reason"]


def test_personalized_recommendation_based_on_preferences():
    payload = {
        "candidate_books": SAMPLE_CANDIDATES,
        "preferences": {
            "favorite_genres": ["Architecture & Design"],
            "favorite_categories": ["Architecture"],
            "favorite_authors": ["Helena Vance"],
        },
        "limit": 2,
    }

    response = client.post("/api/recommendations", headers=AUTH_HEADERS, json=payload)
    assert response.status_code == 200
    body = response.json()

    assert body["is_personalized"] is True
    assert len(body["data"]) == 2

    # Top recommendations should be Helena Vance architecture books
    for item in body["data"]:
        assert item["book"]["genre"] == "Architecture & Design"
        assert item["matched_author"] == "Helena Vance"
        assert "Helena Vance" in item["reason"] or "Architecture" in item["reason"]


# ============================================================================
# 5. EXCLUSION OF PREVIOUSLY BORROWED & FAVORITED BOOKS
# ============================================================================
def test_avoids_recommending_already_borrowed_and_favorited_books():
    # User already has book_1 as borrowed and book_3 as favorite
    payload = {
        "candidate_books": SAMPLE_CANDIDATES,
        "borrowed_books": [SAMPLE_CANDIDATES[0]],  # book_1
        "favorite_books": [SAMPLE_CANDIDATES[2]],  # book_3
        "limit": 5,
        "exclude_previously_borrowed": True,
    }

    response = client.post("/api/recommendations", headers=AUTH_HEADERS, json=payload)
    assert response.status_code == 200
    body = response.json()

    recommended_ids = [item["book"]["id"] for item in body["data"]]
    assert "book_1" not in recommended_ids, "Previously borrowed book_1 must be excluded"
    assert "book_3" not in recommended_ids, "Favorited book_3 must be excluded"


def test_explicit_excluded_book_ids_are_honored():
    payload = {
        "candidate_books": SAMPLE_CANDIDATES,
        "excluded_book_ids": ["book_1", "book_4"],
        "limit": 5,
    }

    response = client.post("/api/recommendations", headers=AUTH_HEADERS, json=payload)
    assert response.status_code == 200
    recommended_ids = [item["book"]["id"] for item in response.json()["data"]]
    assert "book_1" not in recommended_ids
    assert "book_4" not in recommended_ids


# ============================================================================
# 6. AVAILABILITY PREFERENCE
# ============================================================================
def test_prefers_available_copies_over_out_of_stock_books():
    # book_1 and book_2 are both Astrophysics; book_1 has 5 copies, book_2 has 0 copies
    payload = {
        "candidate_books": [SAMPLE_CANDIDATES[0], SAMPLE_CANDIDATES[1]],
        "preferences": {"favorite_genres": ["Astrophysics"]},
        "prefer_available": True,
        "limit": 2,
    }

    response = client.post("/api/recommendations", headers=AUTH_HEADERS, json=payload)
    assert response.status_code == 200
    body = response.json()

    # book_1 with available copies must rank higher than book_2 (0 copies)
    assert body["data"][0]["book"]["id"] == "book_1"
    assert body["data"][0]["score"] > body["data"][1]["score"]


# ============================================================================
# 7. CONFIGURABLE LIMIT
# ============================================================================
def test_respects_configurable_limit():
    for limit in [1, 2, 4]:
        payload = {
            "candidate_books": SAMPLE_CANDIDATES,
            "limit": limit,
        }
        response = client.post("/api/recommendations", headers=AUTH_HEADERS, json=payload)
        assert response.status_code == 200
        assert len(response.json()["data"]) == limit
        assert response.json()["total"] == limit


# ============================================================================
# 8. GRACEFUL HANDLING OF EMPTY CATALOG
# ============================================================================
def test_empty_candidates_handled_gracefully():
    payload = {
        "candidate_books": [],
        "preferences": {"favorite_genres": ["History"]},
    }
    response = client.post("/api/recommendations", headers=AUTH_HEADERS, json=payload)
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["total"] == 0
    assert body["data"] == []


# ============================================================================
# 9. EDUCATIONAL PBL DISCLAIMER
# ============================================================================
def test_response_includes_educational_disclaimer():
    payload = {"candidate_books": SAMPLE_CANDIDATES}
    response = client.post("/api/recommendations", headers=AUTH_HEADERS, json=payload)
    assert response.status_code == 200
    body = response.json()
    assert "Educational PBL demonstration" in body["disclaimer"]
    assert "scientifically validated" in body["disclaimer"]


# ============================================================================
# 10. HEALTH & DEPLOYMENT DIAGNOSTICS
# ============================================================================
def test_health_check_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "healthy"
    assert "BookSphere" in body["service"]
    assert "version" in body
    assert "timestamp" in body


def test_api_health_check_alias():
    response = client.get("/api/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "healthy"


def test_secrets_never_leaked_in_responses():
    # 1. Health check should never contain the raw secret token
    health_resp = client.get("/health")
    assert VALID_TOKEN not in health_resp.text

    # 2. Root probe should never contain the raw secret token
    root_resp = client.get("/")
    assert VALID_TOKEN not in root_resp.text

    # 3. 401 Unauthorized responses should never leak the expected token
    unauth_resp = client.post(
        "/api/recommendations",
        headers={"Authorization": "Bearer totally_wrong_token"},
        json={"candidate_books": []},
    )
    assert unauth_resp.status_code == 401
    assert VALID_TOKEN not in unauth_resp.text

