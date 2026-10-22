# BookSphere AI Recommendation Service (FastAPI)

Personalized book recommendation engine for **BookSphere — Online Book Management System**, built using Python, FastAPI, and Pydantic.

> **Important Educational Note:**  
> This service is an educational Project-Based Learning (PBL) recommendation engine demonstrating content-based filtering principles. It is **not** a clinical or safety-critical system, and no claim is made that the algorithm is scientifically validated.

---

## 🛠 Technology Stack

- **Framework:** FastAPI
- **Data Validation:** Pydantic v2 & Pydantic-Settings
- **Server:** Uvicorn
- **HTTP Client & Testing:** HTTPX, Pytest
- **Python Version:** 3.13+

---

## 📂 Project Architecture

```
ai-service/
├── .venv/                     # Python virtual environment
├── app/
│   ├── __init__.py
│   ├── config.py              # Environment configuration & Pydantic settings
│   ├── auth.py                # Service-to-service authentication (AI_SERVICE_TOKEN)
│   ├── models.py              # Pydantic schemas (BookItem, Requests, Responses)
│   ├── recommender.py         # Transparent content-based recommendation algorithm
│   └── main.py                # FastAPI app with /health and /api/recommendations
├── tests/
│   ├── __init__.py
│   └── test_recommendations.py # Comprehensive pytest test suite (15 tests)
├── .env                       # Environment configuration
├── requirements.txt
└── README.md
```

---

## ⚙️ Environment Configuration (`.env`)

```ini
PORT=8000
HOST=127.0.0.1
ENVIRONMENT=development

# Service-to-service secret token (shared with BookSphere Express backend)
AI_SERVICE_TOKEN=bd6b0002abf3404cb10e83815b23d0e47dbf6c1efb8d9b2f532ae2ec7b63a0ab
```

---

## 🚀 Running the Service

### 1. Activate Virtual Environment
On Windows (PowerShell):
```powershell
.\.venv\Scripts\Activate.ps1
```

### 2. Start Uvicorn Server
```bash
uvicorn app.main:app --reload --port 8000
```
- API Landing & Diagnostics: `http://127.0.0.1:8000/`
- Interactive Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc UI: `http://127.0.0.1:8000/redoc`

### 3. Run Automated Tests
```bash
python -m pytest -v
```

---

## 📡 API Reference

### 1. Health Probe
- **`GET /health`**  
  Returns operational status and service metadata for Express backend health monitoring.  
  *No authentication required.*

  **Response:**
  ```json
  {
    "status": "healthy",
    "service": "BookSphere AI Recommendation Service",
    "version": "1.0.0",
    "timestamp": "2026-10-18T16:16:51.208151+00:00",
    "environment": "development"
  }
  ```

---

### 2. Book Recommendations
- **`POST /api/recommendations`**  
  Generates personalized or cold-start book recommendations.

  **Security:**  
  Requires service-to-service authentication using `AI_SERVICE_TOKEN`. Supply either:
  - Header: `Authorization: Bearer <AI_SERVICE_TOKEN>`
  - Header: `X-AI-Service-Token: <AI_SERVICE_TOKEN>`

  **Request Body:**
  ```json
  {
    "preferences": {
      "favorite_genres": ["Architecture & Design", "Astrophysics"],
      "favorite_categories": ["Architecture", "Science & Technology"],
      "favorite_authors": ["Helena Vance"]
    },
    "borrowed_books": [
      {
        "id": "6ad4de894394d5c2cf20697a",
        "title": "The Architecture of Silence",
        "author": "Helena Vance",
        "genre": "Architecture & Design",
        "category": "Architecture"
      }
    ],
    "favorite_books": [],
    "recently_viewed_books": [],
    "candidate_books": [ ... ],
    "exclude_previously_borrowed": true,
    "prefer_available": true,
    "limit": 5
  }
  ```

  **Response Structure:**
  ```json
  {
    "success": true,
    "total": 3,
    "strategy": "personalized_content_based",
    "is_personalized": true,
    "disclaimer": "Educational PBL demonstration recommendation engine. Built using content-based filtering algorithms; not a scientifically validated or clinical system.",
    "data": [
      {
        "book": {
          "id": "6ad4de894394d5c2cf20697b",
          "title": "Modernist Urbanism and Concrete Forms",
          "author": "Helena Vance",
          "genre": "Architecture & Design",
          "category": "Architecture",
          "availableCopies": 4,
          "rating": 4.8
        },
        "score": 0.885,
        "reason": "Recommended because you enjoy Architecture & Design and have explored previous works by Helena Vance.",
        "matched_genre": "Architecture & Design",
        "matched_category": "Architecture",
        "matched_author": "Helena Vance",
        "matched_keywords": ["urbanism", "concrete"]
      }
    ]
  }
  ```

---

## 🧠 Recommendation Algorithm Design

The engine implements a **transparent, multi-factor content-based filtering algorithm**:

1. **Composite User Profile:**
   - **Declared Preferences:** Highest weight ($3.5\times$) for explicit user genres, categories, and authors.
   - **Favorites Shelf:** High weight ($3.0\times$) reflecting deliberate patron affinity.
   - **Borrowing History:** High weight ($2.5\times$) reflecting proven interest.
   - **Recently Viewed:** Moderate weight ($1.5\times$) for browsing context.
   - **Topical Keywords:** Tokenizes synopses and titles (removing English stopwords) to identify recurrent thematic concepts.

2. **Scoring Formula:**
   $$\text{Score} = w_{\text{genre}} \cdot S_{\text{genre}} + w_{\text{cat}} \cdot S_{\text{cat}} + w_{\text{author}} \cdot S_{\text{author}} + w_{\text{kw}} \cdot S_{\text{kw}} + \text{Bonus}_{\text{avail}} + \text{Bonus}_{\text{rating}}$$
   - Genre Affinity ($w = 0.32$)
   - Category Affinity ($w = 0.20$)
   - Author Affinity ($w = 0.26$)
   - Keyword / Topic Overlap ($w = 0.12$)
   - Availability Preference ($+0.05$ if `availableCopies > 0`)
   - Rating Weight ($+0.05 \times \frac{\text{rating}}{5.0}$)

3. **Exclusion Rules:**
   - Automatically excludes volumes the patron has already borrowed (or currently holds in favorites) to guarantee fresh discovery.

4. **Cold-Start Fallback:**
   - For new patrons with no borrowing history and no declared preferences, the engine seamlessly switches to `cold_start_popular` strategy, prioritizing critically acclaimed titles ($4.5★+$) that have available lending copies in circulation.

5. **Explainability:**
   - Every recommended item features a transparent, human-readable `reason` articulating why it was matched (e.g. author continuity, genre resonance, thematic keyword overlap, or catalog highlight).
