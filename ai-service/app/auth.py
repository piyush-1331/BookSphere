import secrets
from typing import Optional
from fastapi import Header, HTTPException, status
from app.config import get_settings


def verify_service_token(
    authorization: Optional[str] = Header(None, alias="Authorization"),
    x_ai_service_token: Optional[str] = Header(None, alias="X-AI-Service-Token"),
) -> str:
    """
    Validates service-to-service authorization token.
    Accepts:
      1. 'Authorization: Bearer <AI_SERVICE_TOKEN>'
      2. 'X-AI-Service-Token: <AI_SERVICE_TOKEN>'

    Uses constant-time comparison to prevent timing attacks.
    Never reflects or leaks the actual token in error messages.
    """
    settings = get_settings()
    configured_token = settings.AI_SERVICE_TOKEN

    provided_token: Optional[str] = None

    if authorization:
        parts = authorization.strip().split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            provided_token = parts[1]
        elif len(parts) == 1:
            provided_token = parts[0]

    if not provided_token and x_ai_service_token:
        provided_token = x_ai_service_token.strip()

    if not provided_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "success": False,
                "error": {
                    "code": "MISSING_SERVICE_TOKEN",
                    "message": "Authentication required. Provide Authorization Bearer token or X-AI-Service-Token header.",
                },
            },
        )

    # Constant-time comparison protects against timing oracle attacks
    if not secrets.compare_digest(provided_token, configured_token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "success": False,
                "error": {
                    "code": "INVALID_SERVICE_TOKEN",
                    "message": "Access denied. The provided service token is invalid.",
                },
            },
        )

    return "authenticated_service"
