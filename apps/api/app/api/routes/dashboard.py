from fastapi import APIRouter

from app.schemas.dashboard import DashboardSnapshot
from app.services.mock_data import get_dashboard_snapshot

router = APIRouter(tags=["dashboard"])


@router.get("/dashboard/overview", response_model=DashboardSnapshot)
def dashboard_overview() -> DashboardSnapshot:
    return get_dashboard_snapshot()
