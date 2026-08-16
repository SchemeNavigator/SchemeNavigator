from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.router import api_router
from app.core.api_config import get_api_config
from app.core.config import Settings, environment_diagnostics, get_settings, load_environment
from app.core.exceptions import register_exception_handlers
from app.core.logging import configure_logging, get_logger
from app.middleware.request_tracking import request_tracking_middleware
from app.repositories.scheme_repository import SchemeRepository
from app.services.recommendation_service import RecommendationService, UnavailableLLMService, WorkflowStore
from app.graph.workflow_engine import WorkflowEngine
from app.services.llm_service import LLMService
from app.services.scheme_service import SchemeService


logger = get_logger(__name__)


def create_app(settings: Settings | None = None) -> FastAPI:
    load_environment()
    resolved_settings = settings or get_settings()
    configure_logging(resolved_settings.log_level)

    env_diag = environment_diagnostics()
    logger.info("Environment file found: %s", env_diag.get("env_found"))
    logger.info("Environment file path: %s", env_diag.get("env_path"))
    logger.info("OPENROUTER_MODEL exists: %s", env_diag.get("openrouter_model_exists"))
    logger.info("OPENROUTER_API_KEY exists: %s", env_diag.get("openrouter_api_key_exists"))

    repository = SchemeRepository(resolved_settings.csv_path)
    service = SchemeService(repository)
    api_config = get_api_config()

    try:
        llm_service = LLMService()
    except Exception:
        llm_service = UnavailableLLMService()

    workflow_engine = WorkflowEngine(llm_service=llm_service, repository=repository, config={"timeout_seconds": api_config.timeout_seconds})
    workflow_store = WorkflowStore()
    recommendation_service = RecommendationService(
        workflow_engine=workflow_engine,
        repository=repository,
        llm_service=llm_service,
        api_config=api_config,
        workflow_store=workflow_store,
    )

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        logger.info("Application startup: preloading CSV data")
        service.warm_up()
        app.state.settings = resolved_settings
        app.state.repository = repository
        app.state.service = service
        app.state.api_config = api_config
        app.state.llm_service = llm_service
        app.state.workflow_engine = workflow_engine
        app.state.workflow_store = workflow_store
        app.state.recommendation_service = recommendation_service
        yield
        logger.info("Application shutdown complete")

    app = FastAPI(
        title="Scheme Navigator Backend",
        version="1.0.0",
        description="Production-ready FastAPI backend foundation for Scheme Navigator.",
        lifespan=lifespan,
    )

    register_exception_handlers(app)
    app.include_router(api_router)
    app.middleware("http")(request_tracking_middleware)
    return app
