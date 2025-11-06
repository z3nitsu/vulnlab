from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Runtime configuration for the backend service."""

    app_name: str = Field(default="VulnLabs Backend")
    debug: bool = Field(default=False)
    database_url: str = Field(
        default=f"sqlite:///{Path(__file__).resolve().parent / 'data' / 'vulnlabs.db'}"
    )
    challenge_root: Path = Field(
        default=Path(__file__).resolve().parent / "challenges"
    )
    log_level: str = Field(default="INFO")
    semgrep_rules_root: Path = Field(
        default=Path(__file__).resolve().parent
        / "static_analysis"
        / "semgrep"
    )
    semgrep_binary: str = Field(default="semgrep")
    semgrep_timeout_seconds: int = Field(default=20)
    bandit_binary: str = Field(default="bandit")
    bandit_timeout_seconds: int = Field(default=10)
    bandit_severity: str = Field(default="LOW")
    bandit_confidence: str = Field(default="LOW")
    api_key: str | None = Field(default=None)
    sandbox_timeout_seconds: int = Field(default=5)
    python_executable: str = Field(default="python3")
    sandbox_driver: str = Field(default="local")
    docker_binary: str = Field(default="docker")
    docker_image: str = Field(default="python:3.11-slim")
    docker_memory_limit: str = Field(default="128m")
    docker_cpu_shares: int = Field(default=256)
    cors_allow_origins: list[str] = Field(
        default_factory=lambda: [
            "http://127.0.0.1:5173",
            "http://localhost:5173",
        ]
    )

    model_config = {
        "env_prefix": "VULNLABS_",
        "case_sensitive": False,
    }


@lru_cache
def get_settings() -> Settings:
    return Settings()
