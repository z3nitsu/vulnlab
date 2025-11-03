from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol, Sequence

from ..models import Submission
from ..types import SubmissionStatus


@dataclass
class AnalysisIssue:
    tool: str
    message: str
    severity: str = "info"


@dataclass
class ScoringResult:
    status: SubmissionStatus
    score: int | None = None
    feedback: str | None = None
    issues: list[AnalysisIssue] | None = None


class StaticAnalyzer(Protocol):
    def analyze(self, submission: Submission) -> Sequence[AnalysisIssue]:
        ...


class SandboxExecutor(Protocol):
    def run_tests(self, submission: Submission) -> tuple[bool, str]:
        ...


class ChallengeScoringService:
    """Orchestrates scoring for a submission.

    This is a stub that currently marks submissions as pending. In future
    iterations it will invoke static analyzers and sandbox execution.
    """

    def __init__(
        self,
        analyzers: Sequence[StaticAnalyzer] | None = None,
        sandbox: SandboxExecutor | None = None,
    ) -> None:
        self.analyzers = analyzers or []
        self.sandbox = sandbox

    def score(self, submission: Submission) -> ScoringResult:
        # Placeholder until analyzers and sandbox integration are implemented.
        return ScoringResult(
            status=SubmissionStatus.pending,
            score=None,
            feedback="Scoring pending – analysis pipeline not yet implemented.",
            issues=[],
        )
