from __future__ import annotations

from datetime import datetime
from typing import Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field

from .types import SubmissionStatus


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


class SubmissionCreate(BaseModel):
    challenge_slug: str
    code: str = Field(min_length=1)
    user_handle: Optional[str] = Field(default=None, max_length=64)


class AnalysisIssueOut(BaseModel):
    tool: str
    message: str
    severity: str


class SubmissionOut(BaseModel):
    id: str
    challenge_slug: str
    user_handle: Optional[str]
    code: str
    status: SubmissionStatus
    score: Optional[int]
    feedback: Optional[str]
    issues: Optional[List[AnalysisIssueOut]] = Field(
        default=None, alias="analysis_report", serialization_alias="issues"
    )
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class StatusCount(BaseModel):
    status: SubmissionStatus
    count: int


class SubmissionStats(BaseModel):
    total: int
    average_score: Optional[float]
    status_counts: List[StatusCount]
