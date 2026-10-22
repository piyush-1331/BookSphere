import datetime
from fastapi import FastAPI, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.auth import verify_service_token
from app.models import (
    HealthResponse,
    RecommendationRequest,
    RecommendationResponse,
)
from app.recommender import recommender_engine

settings = get_settings()

app = FastAPI(
    title=settings.SERVICE_NAME,
    version=settings.SERVICE_VERSION,
    description=(
        "Personalized Book Recommendation Service for BookSphere. "
        "Educational PBL implementation demonstrating transparent, content-based filtering."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
)

# Enable CORS for local development and Express backend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["Diagnostic"])
def root():
    """Service landing probe."""
    return {
        "service": settings.SERVICE_NAME,
        "version": settings.SERVICE_VERSION,
        "status": "online",
        "documentation": "/docs",
        "health": "/health",
        "recommendations": "/api/recommendations",
    }


@app.get(
    "/health",
    response_model=HealthResponse,
    tags=["Diagnostic"],
    summary="Health check probe for container orchestrators and Express backend",
)
def health_check():
    """
    Returns real-time operational status and runtime metadata.
    """
    return HealthResponse(
        status="healthy",
        service=settings.SERVICE_NAME,
        version=settings.SERVICE_VERSION,
        timestamp=datetime.datetime.now(datetime.timezone.utc).isoformat(),
        environment=settings.ENVIRONMENT,
    )


@app.get(
    "/api/health",
    response_model=HealthResponse,
    tags=["Diagnostic"],
    include_in_schema=False,
)
def api_health_check():
    """Alias for /health check for Express backend consistency."""
    return health_check()


@app.post(
    "/api/recommendations",
    response_model=RecommendationResponse,
    tags=["Recommendations"],
    summary="Generate personalized or cold-start book recommendations",
    status_code=status.HTTP_200_OK,
)
def get_recommendations(
    request: RecommendationRequest,
    _auth: str = Depends(verify_service_token),
):
    """
    Computes personalized book recommendations using content-based filtering.

    **Security:**
    Requires `AI_SERVICE_TOKEN` via `Authorization: Bearer <token>` or `X-AI-Service-Token: <token>`.

    **Behavior:**
    - If user has borrowing history, favorites, or stated preferences, ranks candidates
      using genre, category, author, and description keyword affinities.
    - If user is new with empty history, gracefully falls back to popular, high-rated,
      and currently available books.
    - Excludes previously borrowed books by default.
    - Attaches a human-readable reason to every recommendation item.
    """
    return recommender_engine.generate_recommendations(request)


if __name__ == "__main__":
    import os
    import uvicorn

    port = int(os.environ.get("PORT", settings.PORT))
    host = os.environ.get("HOST", settings.HOST or "0.0.0.0")
    reload_enabled = os.environ.get("RELOAD", "false").lower() == "true" or settings.ENVIRONMENT == "development"

    print(f"[FastAPI] Starting BookSphere AI Recommendation Service on {host}:{port}")
    uvicorn.run("app.main:app", host=host, port=port, reload=reload_enabled)
