from fastapi import Depends, FastAPI, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from .config import Settings, get_settings
from .db import get_session
from .models import Challenge
from .schemas import ChallengeOut, ChallengeSummary


def create_app(settings: Settings) -> FastAPI:
    app = FastAPI(title=settings.app_name, debug=settings.debug)

    @app.get("/health", tags=["system"])
    async def health() -> JSONResponse:
        return JSONResponse({"status": "ok"})

    @app.get(
        "/challenges",
        response_model=list[ChallengeSummary],
        tags=["challenges"],
    )
    async def list_challenges(
        session: Session = Depends(get_session),
    ) -> list[ChallengeSummary]:
        result = session.execute(select(Challenge).order_by(Challenge.slug))
        challenges = result.scalars().all()
        return [ChallengeSummary.model_validate(challenge) for challenge in challenges]

    @app.get(
        "/challenges/{slug}",
        response_model=ChallengeOut,
        tags=["challenges"],
    )
    async def get_challenge(
        slug: str,
        session: Session = Depends(get_session),
    ) -> ChallengeOut:
        challenge = session.get(Challenge, slug)
        if not challenge:
            raise HTTPException(status_code=404, detail="Challenge not found")
        return ChallengeOut.model_validate(challenge)

    return app


settings = get_settings()
app = create_app(settings)
