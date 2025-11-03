from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.responses import JSONResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from .config import Settings, get_settings
from .db import get_session
from .models import Challenge, Submission
from .schemas import (
    ChallengeOut,
    ChallengeSummary,
    SubmissionCreate,
    SubmissionOut,
)
from .services.scoring import ChallengeScoringService


def create_app(settings: Settings) -> FastAPI:
    app = FastAPI(title=settings.app_name, debug=settings.debug)
    app.state.scoring_service = ChallengeScoringService()

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

    @app.post(
        "/submissions",
        response_model=SubmissionOut,
        status_code=status.HTTP_201_CREATED,
        tags=["submissions"],
    )
    async def create_submission(
        payload: SubmissionCreate,
        session: Session = Depends(get_session),
    ) -> SubmissionOut:
        challenge = session.get(Challenge, payload.challenge_slug)
        if not challenge:
            raise HTTPException(status_code=404, detail="Challenge not found")

        submission = Submission(
            challenge_slug=payload.challenge_slug,
            code=payload.code,
            user_handle=payload.user_handle,
        )
        session.add(submission)
        session.commit()
        session.refresh(submission)

        scoring_service: ChallengeScoringService = app.state.scoring_service
        result = scoring_service.score(submission)
        submission.status = result.status
        submission.score = result.score
        submission.feedback = result.feedback
        session.add(submission)
        session.commit()
        session.refresh(submission)

        return SubmissionOut.model_validate(submission)

    @app.get(
        "/submissions",
        response_model=list[SubmissionOut],
        tags=["submissions"],
    )
    async def list_submissions(
        challenge_slug: str | None = Query(default=None),
        session: Session = Depends(get_session),
    ) -> list[SubmissionOut]:
        stmt = select(Submission).order_by(Submission.created_at.desc())
        if challenge_slug:
            stmt = stmt.where(Submission.challenge_slug == challenge_slug)
        submissions = session.execute(stmt).scalars().all()
        return [SubmissionOut.model_validate(item) for item in submissions]

    @app.get(
        "/submissions/{submission_id}",
        response_model=SubmissionOut,
        tags=["submissions"],
    )
    async def get_submission(
        submission_id: str,
        session: Session = Depends(get_session),
    ) -> SubmissionOut:
        submission = session.get(Submission, submission_id)
        if not submission:
            raise HTTPException(status_code=404, detail="Submission not found")
        return SubmissionOut.model_validate(submission)

    return app


settings = get_settings()
app = create_app(settings)
