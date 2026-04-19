from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.db.session import SessionLocal, init_db
from app.routes.assets import router as asset_router
from app.routes.corridors import router as corridor_router
from app.routes.grid import router as grid_router
from app.routes.llm import router as llm_router
from app.services.database_seed import seed_reference_data
from app.services.model_registry import ModelRegistry


settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    registry = ModelRegistry(settings)
    registry.load_all()
    app.state.model_registry = registry
    with SessionLocal() as session:
        seed_reference_data(session)
    yield


app = FastAPI(title=settings.app_name, lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.frontend_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, object]:
    registry = getattr(app.state, "model_registry", None)
    return {
        "status": "ok",
        "environment": settings.environment,
        "loaded_artifacts": [] if registry is None else registry.loaded_artifacts,
    }


app.include_router(asset_router, prefix=settings.api_prefix)
app.include_router(grid_router, prefix=settings.api_prefix)
app.include_router(corridor_router, prefix=settings.api_prefix)
app.include_router(llm_router, prefix=settings.api_prefix)
