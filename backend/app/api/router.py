from fastapi import APIRouter

from app.api.routes.health import router as health_router
from app.api.routes.health_v2 import router as ai_health_router
from app.api.routes.root import router as root_router
from app.api.routes.recommendations import router as recommendations_router
from app.api.routes.schemes import router as schemes_router
from app.api.routes.survey import router as survey_router
from app.api.routes.workflow_debug import router as workflow_debug_router


api_router = APIRouter()
api_router.include_router(root_router)
api_router.include_router(health_router)
api_router.include_router(schemes_router)
api_router.include_router(survey_router)
api_router.include_router(recommendations_router)
api_router.include_router(ai_health_router)
api_router.include_router(workflow_debug_router)
