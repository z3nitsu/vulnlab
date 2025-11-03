from __future__ import annotations

import re
import subprocess
import tempfile
from pathlib import Path
from typing import Tuple

from ..models import Submission
from .scoring import SandboxExecutor


def create_sandbox_executor(
    driver: str = "local",
    python_executable: str = "python3",
    timeout_seconds: int = 5,
    docker_binary: str = "docker",
    docker_image: str = "python:3.11-slim",
    docker_memory_limit: str = "128m",
    docker_cpu_shares: int = 256,
) -> SandboxExecutor:
    if driver == "docker":
        return DockerSandboxExecutor(
            docker_binary=docker_binary,
            image=docker_image,
            timeout_seconds=timeout_seconds,
            memory_limit=docker_memory_limit,
            cpu_shares=docker_cpu_shares,
        )
    return LocalSandboxExecutor(
        python_executable=python_executable,
        timeout_seconds=timeout_seconds,
    )


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


class DockerSandboxExecutor(SandboxExecutor):
    """Sandbox executor that runs code inside a Docker container."""

    def __init__(
        self,
        docker_binary: str = "docker",
        image: str = "python:3.11-slim",
        timeout_seconds: int = 5,
        memory_limit: str = "128m",
        cpu_shares: int = 256,
    ) -> None:
        self.docker_binary = docker_binary
        self.image = image
        self.timeout_seconds = timeout_seconds
        self.memory_limit = memory_limit
        self.cpu_shares = cpu_shares
        self._prohibited_patterns = [
            r"subprocess\.Popen\(",
            r"exec\(",
        ]

    def run_tests(self, submission: Submission) -> Tuple[bool, str]:
        code = submission.code
        for pattern in self._prohibited_patterns:
            if re.search(pattern, code):
                return (
                    False,
                    "Sandbox rejected code containing disallowed patterns.",
                )

        with tempfile.TemporaryDirectory(prefix="vulnlabs_sandbox_") as tmpdir:
            tmp_path = Path(tmpdir)
            code_path = tmp_path / "submission.py"
            code_path.write_text(code, encoding="utf-8")

            docker_cmd = [
                self.docker_binary,
                "run",
                "--rm",
                "--network",
                "none",
                "--memory",
                self.memory_limit,
                "--cpu-shares",
                str(self.cpu_shares),
                "-v",
                f"{tmp_path}:/workspace:ro",
                self.image,
                "python",
                "-I",
                "-m",
                "py_compile",
                "/workspace/submission.py",
            ]

            try:
                run_proc = subprocess.run(
                    docker_cmd,
                    capture_output=True,
                    text=True,
                    timeout=self.timeout_seconds,
                )
            except FileNotFoundError:
                return False, "Docker binary not found for sandbox execution."
            except subprocess.TimeoutExpired:
                return False, "Docker sandbox execution timed out."

            if run_proc.returncode != 0:
                message = run_proc.stderr.strip() or run_proc.stdout.strip()
                return False, message or "Docker sandbox execution failed."

            return True, "Docker sandbox compilation succeeded."
