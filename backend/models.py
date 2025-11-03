from __future__ import annotations

from datetime import datetime
from typing import List, Optional
from uuid import uuid4

from sqlalchemy import DateTime, Enum as SAEnum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON, Text

from .types import SubmissionStatus

from .db import Base


class Challenge(Base):
    """Persisted representation of a vulnerable coding challenge."""

    __tablename__ = "challenges"

    slug: Mapped[str] = mapped_column(String(64), primary_key=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    language: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    vulnerable_snippet: Mapped[str] = mapped_column(Text, nullable=False)
    acceptance_criteria: Mapped[List[str]] = mapped_column(JSON, nullable=False)
    hints: Mapped[Optional[List[str]]] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )
    submissions: Mapped[list["Submission"]] = relationship(
        "Submission",
        back_populates="challenge",
        cascade="all, delete-orphan",
    )


class Submission(Base):
    """Track user fixes awaiting scoring."""

    __tablename__ = "submissions"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid4())
    )
    challenge_slug: Mapped[str] = mapped_column(
        ForeignKey("challenges.slug", ondelete="CASCADE"), nullable=False, index=True
    )
    user_handle: Mapped[Optional[str]] = mapped_column(String(64))
    code: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[SubmissionStatus] = mapped_column(
        SAEnum(SubmissionStatus), default=SubmissionStatus.pending, nullable=False
    )
    score: Mapped[Optional[int]] = mapped_column()
    feedback: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    challenge: Mapped[Challenge] = relationship("Challenge", back_populates="submissions")
