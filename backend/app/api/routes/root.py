from fastapi import APIRouter

from app.core.response import standard_response
from app.models.response import StandardResponse


router = APIRouter(tags=["System"])


@router.get(
    "/",
    response_model=StandardResponse[dict],
    summary="Backend root",
    description="Simple root endpoint used to confirm that the backend is running.",
    status_code=200,
)
def root() -> StandardResponse[dict]:
    return standard_response(True, "Backend Running", {"status": "Backend Running"})
