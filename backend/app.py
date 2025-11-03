import logging
from decimal import Decimal

from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.responses import JSONResponse
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .config import Settings, get_settings
from .db import get_session
from .db_init import init_db
from .logging import configure_logging
from .models import Challenge, Submission
from .schemas import (
    AnalysisIssueOut,
    ChallengeOut,
    ChallengeSummary,
    StatusCount,
    SubmissionCreate,
    SubmissionOut,
    SubmissionStats,
)
from .services.analyzers import BanditAnalyzer, SemgrepAnalyzer
from .services.scoring import ChallengeScoringService

logger = logging.getLogger(__name__)


def create_app(settings: Settings) -> FastAPI:
    configure_logging(settings)
    init_db(settings)
    app = FastAPI(title=settings.app_name, debug=settings.debug)

    semgrep_rules = [
        settings.semgrep_rules_root / "python" / "sqli_unsafe.yaml",
        settings.semgrep_rules_root / "python" / "xss_unescaped.yaml",
        settings.semgrep_rules_root / "python" / "command_injection.yaml",
    ]
    analyzers = [
        SemgrepAnalyzer(semgrep_rules),
        BanditAnalyzer(
            binary=settings.bandit_binary,
            timeout_seconds=settings.bandit_timeout_seconds,
            severity=settings.bandit_severity,
            confidence=settings.bandit_confidence,
        ),
    ]

    app.state.scoring_service = ChallengeScoringService(analyzers=analyzers)

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

        logger.info(
            "Received submission for challenge=%s user=%s",
            payload.challenge_slug,
            payload.user_handle or "anonymous",
        )

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
        submission.analysis_report = [
            {
                "tool": issue.tool,
                "message": issue.message,
                "severity": issue.severity,
            }
            for issue in result.issues or []
        ]
        session.add(submission)
        session.commit()
        session.refresh(submission)

        logger.info(
            "Submission scored id=%s status=%s",
            submission.id,
            submission.status.value,
        )

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

    @app.post(
        "/submissions/{submission_id}/rescore",
        response_model=SubmissionOut,
        tags=["submissions"],
    )
    async def rescore_submission(
        submission_id: str,
        session: Session = Depends(get_session),
    ) -> SubmissionOut:
        submission = session.get(Submission, submission_id)
        if not submission:
            raise HTTPException(status_code=404, detail="Submission not found")

        scoring_service: ChallengeScoringService = app.state.scoring_service
        result = scoring_service.score(submission)
        submission.status = result.status
        submission.score = result.score
        submission.feedback = result.feedback
        submission.analysis_report = [
            {
                "tool": issue.tool,
                "message": issue.message,
                "severity": issue.severity,
            }
            for issue in result.issues or []
        ]
        session.add(submission)
        session.commit()
        session.refresh(submission)

        logger.info(
            "Submission rescored id=%s status=%s",
            submission.id,
            submission.status.value,
        )

        return SubmissionOut.model_validate(submission)

    @app.get(
        "/stats/submissions",
        response_model=SubmissionStats,
        tags=["stats"],
    )
    async def submission_stats(
        session: Session = Depends(get_session),
    ) -> SubmissionStats:
        total = session.scalar(select(func.count(Submission.id))) or 0

        status_rows = session.execute(
            select(Submission.status, func.count(Submission.id)).group_by(Submission.status)
        ).all()
        status_counts = [
            StatusCount(status=row[0], count=row[1]) for row in status_rows
        ]

        avg_score_value = session.scalar(select(func.avg(Submission.score)))
        if isinstance(avg_score_value, Decimal):
            avg_score_value = float(avg_score_value)
        elif avg_score_value is not None:
            avg_score_value = float(avg_score_value)

        return SubmissionStats(
            total=total,
            average_score=avg_score_value,
            status_counts=status_counts,
        )

    return app


settings = get_settings()
app = create_app(settings)
