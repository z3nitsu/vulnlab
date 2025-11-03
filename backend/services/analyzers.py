from __future__ import annotations

import json
import logging
import shutil
import subprocess
import tempfile
from pathlib import Path
from typing import Iterable, Sequence

from ..models import Submission
from .scoring import AnalysisIssue, StaticAnalyzer

logger = logging.getLogger(__name__)


class SemgrepAnalyzer(StaticAnalyzer):
    """Run Semgrep rules against a submission snippet."""

    def __init__(
        self,
        rule_paths: Sequence[Path],
        binary: str = "semgrep",
        timeout_seconds: int = 10,
    ) -> None:
        self.rule_paths = [Path(rule) for rule in rule_paths]
        self.binary = binary
        self.timeout_seconds = timeout_seconds

    def analyze(self, submission: Submission) -> Sequence[AnalysisIssue]:
        if not self.rule_paths:
            return []

        if shutil.which(self.binary) is None:
            logger.debug("Semgrep binary not available; skipping analysis.")
            return []

        with tempfile.TemporaryDirectory() as tmpdir:
            snippet_path = Path(tmpdir) / "submission.py"
            snippet_path.write_text(submission.code, encoding="utf-8")

            cmd = [
                self.binary,
                "scan",
                "--disable-version-check",
                "--quiet",
                "--json",
            ]
            for rule in self.rule_paths:
                if rule.exists():
                    cmd.extend(["--config", str(rule)])
                else:
                    logger.debug("Semgrep rule missing: %s", rule)

            cmd.append(str(snippet_path))

            try:
                completed = subprocess.run(
                    cmd,
                    capture_output=True,
                    text=True,
                    timeout=self.timeout_seconds,
                    check=False,
                )
            except (OSError, subprocess.SubprocessError) as exc:
                logger.warning("Semgrep invocation failed: %s", exc)
                return []

            if completed.returncode not in (0, 1):
                logger.debug(
                    "Semgrep returned non-success exit code %s: %s",
                    completed.returncode,
                    completed.stderr.strip(),
                )
                return []

            try:
                payload = json.loads(completed.stdout or "{}")
            except json.JSONDecodeError:
                logger.debug("Failed to decode Semgrep output.")
                return []

            results = payload.get("results", [])
            issues: list[AnalysisIssue] = []
            for result in results:
                issues.append(
                    AnalysisIssue(
                        tool="semgrep",
                        message=result.get("extra", {}).get(
                            "message", "Semgrep rule triggered."
                        ),
                        severity=result.get("extra", {}).get("severity", "info"),
                    )
                )
            return issues


class BanditAnalyzer(StaticAnalyzer):
    """Run Bandit security checks against a submission snippet."""

    def __init__(
        self,
        binary: str = "bandit",
        timeout_seconds: int = 10,
        severity: str = "LOW",
        confidence: str = "LOW",
    ) -> None:
        self.binary = binary
        self.timeout_seconds = timeout_seconds
        self.severity = severity
        self.confidence = confidence

    def analyze(self, submission: Submission) -> Sequence[AnalysisIssue]:
        if shutil.which(self.binary) is None:
            logger.debug("Bandit binary not available; skipping analysis.")
            return []

        with tempfile.TemporaryDirectory() as tmpdir:
            snippet_path = Path(tmpdir) / "submission.py"
            snippet_path.write_text(submission.code, encoding="utf-8")

            cmd = [
                self.binary,
                "-r",
                str(snippet_path),
                "-f",
                "json",
                "-q",
                "--severity-level",
                self.severity.upper(),
                "--confidence-level",
                self.confidence.upper(),
            ]

            try:
                completed = subprocess.run(
                    cmd,
                    capture_output=True,
                    text=True,
                    timeout=self.timeout_seconds,
                    check=False,
                )
            except (OSError, subprocess.SubprocessError) as exc:
                logger.warning("Bandit invocation failed: %s", exc)
                return []

            if completed.returncode not in (0, 1):
                logger.debug(
                    "Bandit returned non-success exit code %s: %s",
                    completed.returncode,
                    completed.stderr.strip(),
                )
                return []

            try:
                payload = json.loads(completed.stdout or "{}")
            except json.JSONDecodeError:
                logger.debug("Failed to decode Bandit output.")
                return []

            results = payload.get("results", [])
            issues: list[AnalysisIssue] = []
            for result in results:
                issues.append(
                    AnalysisIssue(
                        tool="bandit",
                        message=result.get(
                            "issue_text", "Bandit security issue detected."
                        ),
                        severity=result.get("issue_severity", "MEDIUM"),
                    )
                )
            return issues
