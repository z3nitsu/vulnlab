from __future__ import annotations

import json
from pathlib import Path
from typing import Iterable

from sqlalchemy.orm import Session

from .config import Settings, get_settings
from .db import Base, SessionLocal, engine
from .models import Challenge


def init_db(settings: Settings) -> None:
    """Create database tables if they do not exist."""
    if settings.database_url.startswith("sqlite:///"):
        db_path = Path(settings.database_url.replace("sqlite:///", ""))
        db_path.parent.mkdir(parents=True, exist_ok=True)

    Base.metadata.create_all(bind=engine)
    seed_challenges(settings.challenge_root)


def seed_challenges(challenge_root: Path) -> None:
    """Seed challenge metadata from JSON definitions."""
    json_files = sorted(challenge_root.rglob("*.json"))
    if not json_files:
        return

    with SessionLocal() as session:
        for challenge_data in _load_challenges(json_files):
            _upsert_challenge(session, challenge_data)
        session.commit()


def _load_challenges(files: Iterable[Path]) -> Iterable[dict]:
    for path in files:
        with path.open("r", encoding="utf-8") as f:
            payload = json.load(f)
        payload.setdefault("hints", [])
        payload.setdefault("acceptance_criteria", [])
        payload["slug"] = payload.pop("id")
        yield payload


def _upsert_challenge(session: Session, payload: dict) -> None:
    existing = session.get(Challenge, payload["slug"])
    if existing:
        for key, value in payload.items():
            setattr(existing, key, value)
    else:
        session.add(Challenge(**payload))


if __name__ == "__main__":
    init_db(get_settings())
