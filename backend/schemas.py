from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict


class ChallengeOut(BaseModel):
    slug: str
    title: str
    category: str
    language: str
    description: str
    vulnerable_snippet: str
    acceptance_criteria: List[str]
    hints: List[str]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ChallengeSummary(BaseModel):
    slug: str
    title: str
    category: str
    language: str

    model_config = ConfigDict(from_attributes=True)
