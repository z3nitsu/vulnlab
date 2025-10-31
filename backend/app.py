from fastapi import Depends, FastAPI
from fastapi.responses import JSONResponse

from .config import Settings, get_settings


def create_app(settings: Settings) -> FastAPI:
    app = FastAPI(title=settings.app_name, debug=settings.debug)

    @app.get("/health", tags=["system"])
    async def health() -> JSONResponse:
        return JSONResponse({"status": "ok"})

    return app


settings = get_settings()
app = create_app(settings)
