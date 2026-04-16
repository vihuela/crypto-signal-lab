import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    app_name: str
    app_env: str
    app_port: int
    allowed_origins: list[str]


def get_settings() -> Settings:
    origins = os.getenv("CSL_ALLOWED_ORIGINS", "http://localhost:3000")

    return Settings(
        app_name=os.getenv("CSL_APP_NAME", "Crypto Signal Lab API"),
        app_env=os.getenv("CSL_APP_ENV", "local"),
        app_port=int(os.getenv("CSL_APP_PORT", "8000")),
        allowed_origins=[item.strip() for item in origins.split(",") if item.strip()],
    )
