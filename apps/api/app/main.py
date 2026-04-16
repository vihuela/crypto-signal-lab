from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import dashboard, health, market, meta
from app.core.config import get_settings

settings = get_settings()
docs_enabled = settings.app_env == "local"

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="Local orchestration API for Crypto Signal Lab.",
    docs_url="/docs" if docs_enabled else None,
    redoc_url="/redoc" if docs_enabled else None,
    openapi_url="/openapi.json" if docs_enabled else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(meta.router, prefix="/api/v1")
app.include_router(dashboard.router, prefix="/api/v1")
app.include_router(market.router, prefix="/api/v1")


@app.get("/", tags=["root"])
def root() -> dict[str, str]:
    if docs_enabled:
        return {
            "name": settings.app_name,
            "env": settings.app_env,
            "docs": "/docs",
        }

    return {
        "name": settings.app_name,
        "status": "ok",
    }
