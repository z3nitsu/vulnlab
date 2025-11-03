from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Callable, Protocol, Sequence

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
    """Orchestrates scoring for a submission using lightweight heuristics."""

    def __init__(
        self,
        analyzers: Sequence[StaticAnalyzer] | None = None,
        sandbox: SandboxExecutor | None = None,
    ) -> None:
        self.analyzers = analyzers or []
        self.sandbox = sandbox
        self._heuristics: dict[str, Callable[[Submission], ScoringResult]] = {
            "sqli_001": self._score_sqli_001,
            "xss_001": self._score_xss_001,
            "command_injection_001": self._score_command_injection_001,
        }

    def score(self, submission: Submission) -> ScoringResult:
        issues: list[AnalysisIssue] = []
        for analyzer in self.analyzers:
            issues.extend(analyzer.analyze(submission))

        heuristic = self._heuristics.get(submission.challenge_slug)
        if heuristic:
            result = heuristic(submission)
        else:
            result = ScoringResult(
                status=SubmissionStatus.pending,
                feedback="No heuristic available for this challenge yet.",
            )

        sandbox_issue: AnalysisIssue | None = None
        if self.sandbox:
            try:
                sandbox_ok, sandbox_message = self.sandbox.run_tests(submission)
            except Exception as exc:
                return ScoringResult(
                    status=SubmissionStatus.error,
                    feedback=f"Sandbox execution failed: {exc}",
                    issues=[*issues, AnalysisIssue("sandbox", str(exc), "error")],
                )

            if not sandbox_ok:
                sandbox_issue = AnalysisIssue(
                    tool="sandbox",
                    message=sandbox_message or "Sandbox execution reported failure.",
                    severity="error",
                )
                issues.append(sandbox_issue)
                result.status = SubmissionStatus.failed
                result.score = min(result.score if result.score is not None else 100, 40)
                result.feedback = (
                    f"{result.feedback}\nSandbox: {sandbox_message}"
                    if result.feedback
                    else f"Sandbox: {sandbox_message}"
                )
            elif sandbox_message:
                sandbox_issue = AnalysisIssue(
                    tool="sandbox",
                    message=sandbox_message,
                    severity="info",
                )
                issues.append(sandbox_issue)

        if issues:
            result.issues = issues
            static_issues = [i for i in issues if i.tool != "sandbox"]
            if static_issues:
                rendered = "\n".join(
                    f"- [{issue.severity.upper()}] {issue.message}" for issue in static_issues
                )
                prefix = "Static analysis findings:\n"
                result.feedback = (
                    f"{result.feedback}\n\n{prefix}{rendered}"
                    if result.feedback
                    else f"{prefix}{rendered}"
                )

        return result

    # --- Heuristic scoring helpers -------------------------------------------------

    def _score_sqli_001(self, submission: Submission) -> ScoringResult:
        code = submission.code
        lowered = code.lower()
        uses_parameterization = bool(
            re.search(r"execute\s*\(\s*[^,]+,\s*\{", code)
            or "bindparam" in lowered
            or "?" in code
            or re.search(r":\w+", code)
        )
        unsafe_concatenation = bool(
            re.search(r"['\"]\s*\+\s*[a-zA-Z_]", code)
            or "format(" in lowered
            or re.search(r"\bf['\"]", code)
        )

        if uses_parameterization and not unsafe_concatenation:
            return ScoringResult(
                status=SubmissionStatus.passed,
                score=100,
                feedback="Detected parameterized query usage without direct string concatenation.",
            )

        return ScoringResult(
            status=SubmissionStatus.failed,
            score=20 if uses_parameterization else 0,
            feedback="Did not detect safe parameterized SQL usage; avoid concatenating user input.",
        )

    def _score_xss_001(self, submission: Submission) -> ScoringResult:
        lowered = submission.code.lower()
        uses_escape = any(
            token in lowered
            for token in [
                "html.escape",
                "markupsafe.escape",
                "jinja2.escape",
                "escape_html",
            ]
        )
        uses_sanitizer = "bleach.clean" in lowered or "sanitize" in lowered

        if uses_escape or uses_sanitizer:
            return ScoringResult(
                status=SubmissionStatus.passed,
                score=100,
                feedback="Detected HTML escaping or sanitization before rendering.",
            )

        return ScoringResult(
            status=SubmissionStatus.failed,
            score=0,
            feedback="No escaping or sanitization detected; output remains vulnerable to XSS.",
        )

    def _score_command_injection_001(self, submission: Submission) -> ScoringResult:
        lowered = submission.code.lower()
        uses_subprocess = "subprocess.run" in lowered or "subprocess.check_call" in lowered
        shell_true = "shell=true" in lowered
        still_uses_os_system = "os.system" in lowered

        if uses_subprocess and not shell_true and not still_uses_os_system:
            return ScoringResult(
                status=SubmissionStatus.passed,
                score=100,
                feedback="Detected safe subprocess usage without shell=True or os.system.",
            )

        if still_uses_os_system or shell_true:
            return ScoringResult(
                status=SubmissionStatus.failed,
                score=0,
                feedback="Shell execution still present; switch to subprocess without shell=True.",
            )

        return ScoringResult(
            status=SubmissionStatus.failed,
            score=20 if uses_subprocess else 0,
            feedback="No evidence of safe subprocess usage; ensure commands avoid shell execution.",
        )
