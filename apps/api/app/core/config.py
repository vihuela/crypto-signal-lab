from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv


API_ROOT = Path(__file__).resolve().parents[2]
# In local dev this resolves to the repo root; in the container `/app` is the root.
WORKSPACE_ROOT = API_ROOT.parents[1] if len(API_ROOT.parents) > 1 else API_ROOT

for env_path in (
    WORKSPACE_ROOT / ".env.local",
    WORKSPACE_ROOT / ".env",
    API_ROOT / ".env.local",
    API_ROOT / ".env",
):
    load_dotenv(env_path, override=False)


@dataclass(frozen=True)
class Settings:
    app_name: str
    app_env: str
    app_port: int
    allowed_origins: list[str]
    glassnode_api_key: str | None
    sosovalue_api_key: str | None
    fred_api_key: str | None
    factor_cache_ttl_seconds: int


def get_settings() -> Settings:
    origins = os.getenv("CSL_ALLOWED_ORIGINS", "http://localhost:3000")
    glassnode_api_key = os.getenv("CSL_GLASSNODE_API_KEY") or None
    sosovalue_api_key = os.getenv("CSL_SOSOVALUE_API_KEY") or None
    fred_api_key = os.getenv("CSL_FRED_API_KEY") or None

    return Settings(
        app_name=os.getenv("CSL_APP_NAME", "Crypto Signal Lab API"),
        app_env=os.getenv("CSL_APP_ENV", "local"),
        app_port=int(os.getenv("CSL_APP_PORT", "8000")),
        allowed_origins=[item.strip() for item in origins.split(",") if item.strip()],
        glassnode_api_key=glassnode_api_key,
        sosovalue_api_key=sosovalue_api_key,
        fred_api_key=fred_api_key,
        factor_cache_ttl_seconds=int(os.getenv("CSL_FACTOR_CACHE_TTL_SECONDS", "900")),
    )
