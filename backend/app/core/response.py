from typing import TypeVar

from app.models.response import StandardResponse


T = TypeVar("T")


def standard_response(success: bool, message: str, data: T | None) -> StandardResponse[T]:
    return StandardResponse(success=success, message=message, data=data)
