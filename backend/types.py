from __future__ import annotations

from enum import Enum


class SubmissionStatus(str, Enum):
    pending = "pending"
    running = "running"
    passed = "passed"
    failed = "failed"
    error = "error"
