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
    bandit_binary: str = Field(default="bandit")
    bandit_timeout_seconds: int = Field(default=10)
    bandit_severity: str = Field(default="LOW")
    bandit_confidence: str = Field(default="LOW")
    api_key: str | None = Field(default=None)

    model_config = {
        "env_prefix": "VULNLABS_",
        "case_sensitive": False,
    }


@lru_cache
def get_settings() -> Settings:
    return Settings()
