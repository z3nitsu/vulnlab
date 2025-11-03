from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Tuple

from ..models import Submission
from .scoring import AnalysisIssue, SandboxExecutor


@dataclass
class SandboxResult:
    success: bool
    message: str
    issue: AnalysisIssue | None = None


class LocalSandboxExecutor(SandboxExecutor):
    """Placeholder sandbox executor that performs lightweight safety checks.

    This stub emulates what a containerised execution pipeline would do.
    It should be replaced with a real sandbox that runs user code in an
    isolated environment and reports test outcomes.
    """

    def run_tests(self, submission: Submission) -> Tuple[bool, str]:
        code = submission.code
        prohibited = [
            r"os\.system\(",
            r"subprocess\.Popen\(",
            r"eval\(",
            r"exec\(",
        ]

        for pattern in prohibited:
            if re.search(pattern, code):
                return (
                    False,
                    "Sandbox detected disallowed system operation during execution.",
                )

        return True, "Sandbox execution skipped (stub)."
