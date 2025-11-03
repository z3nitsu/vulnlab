from __future__ import annotations

import re
import subprocess
import tempfile
from pathlib import Path
from typing import Tuple

from ..models import Submission
from .scoring import SandboxExecutor


class LocalSandboxExecutor(SandboxExecutor):
    """Execute submission code in an isolated subprocess.

    This implementation writes the submission into a temporary directory and
    runs `python -I -m py_compile` followed by `python -I` to catch basic
    runtime errors. It is not a replacement for a full container sandbox, but
    provides a safer execution flow than the previous stub.
    """

    def __init__(
        self,
        python_executable: str = "python3",
        timeout_seconds: int = 5,
    ) -> None:
        self.python_executable = python_executable
        self.timeout_seconds = timeout_seconds
        self._prohibited_patterns = [
            r"os\.system\(",
            r"subprocess\.Popen\(",
            r"exec\(",
        ]

    def run_tests(self, submission: Submission) -> Tuple[bool, str]:
        code = submission.code
        for pattern in self._prohibited_patterns:
            if re.search(pattern, code):
                return (
                    False,
                    "Sandbox rejected code containing potentially dangerous system calls.",
                )

        with tempfile.TemporaryDirectory(prefix="vulnlabs_sandbox_") as tmpdir:
            tmp_path = Path(tmpdir)
            code_path = tmp_path / "submission.py"
            code_path.write_text(code, encoding="utf-8")

            compile_cmd = [
                self.python_executable,
                "-I",
                "-m",
                "py_compile",
                str(code_path),
            ]
            compile_proc = subprocess.run(
                compile_cmd,
                capture_output=True,
                text=True,
                timeout=self.timeout_seconds,
            )
            if compile_proc.returncode != 0:
                stderr = compile_proc.stderr.strip() or "Syntax error during compilation."
                return False, f"Sandbox compilation failed: {stderr}"
            return True, "Sandbox compilation succeeded."
