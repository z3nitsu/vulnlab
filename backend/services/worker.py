from __future__ import annotations

import logging
import queue
import threading
from typing import Optional

from ..db import SessionLocal
from ..models import Submission
from ..types import SubmissionStatus
from .scoring import AnalysisIssue, ChallengeScoringService

logger = logging.getLogger(__name__)


class ScoringWorker:
    """Background worker that processes submission scoring asynchronously."""

    def __init__(self, scoring_service: ChallengeScoringService) -> None:
        self.scoring_service = scoring_service
        self._queue: queue.Queue[str | None] = queue.Queue()
        self._stop_event = threading.Event()
        self._thread: Optional[threading.Thread] = None

    def start(self) -> None:
        if self._thread and self._thread.is_alive():
            return
        self._stop_event.clear()
        self._thread = threading.Thread(target=self._run, daemon=True)
        self._thread.start()

    def stop(self) -> None:
        self._stop_event.set()
        self._queue.put(None)
        if self._thread:
            self._thread.join(timeout=5)

    def enqueue(self, submission_id: str) -> None:
        self._queue.put(submission_id)

    def flush(self, timeout: float | None = None) -> None:
        """Block until all queued tasks are processed."""
        self._queue.join()

    def _run(self) -> None:
        while not self._stop_event.is_set():
            submission_id = self._queue.get()
            if submission_id is None:
                self._queue.task_done()
                break
            try:
                self._process_submission(submission_id)
            except Exception as exc:
                logger.exception("Failed to score submission %s: %s", submission_id, exc)
            finally:
                self._queue.task_done()

    def _process_submission(self, submission_id: str) -> None:
        with SessionLocal() as session:
            submission = session.get(Submission, submission_id)
            if not submission:
                logger.warning("Submission %s missing; skipping scoring.", submission_id)
                return

            submission.status = SubmissionStatus.running
            session.add(submission)
            session.commit()
            session.refresh(submission)

            try:
                result = self.scoring_service.score(submission)
            except Exception as exc:
                submission.status = SubmissionStatus.error
                submission.feedback = f"Scoring failure: {exc}"
                submission.score = None
                submission.analysis_report = [
                    {"tool": "scoring", "message": str(exc), "severity": "error"}
                ]
                session.add(submission)
                session.commit()
                return

            submission.status = result.status
            submission.score = result.score
            submission.feedback = result.feedback
            submission.analysis_report = [
                {"tool": issue.tool, "message": issue.message, "severity": issue.severity}
                for issue in result.issues or []
            ]
            session.add(submission)
            session.commit()
