from __future__ import annotations

import logging
import sys

from .config import Settings


def configure_logging(settings: Settings) -> None:
    """Configure application-wide logging."""

    level = getattr(logging, settings.log_level.upper(), logging.INFO)
    logging.basicConfig(
        level=level,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        stream=sys.stdout,
    )

    # Reduce noise from dependencies when not in debug mode.
    if not settings.debug:
        logging.getLogger("uvicorn").setLevel(level)
        logging.getLogger("uvicorn.error").setLevel(level)
        logging.getLogger("uvicorn.access").setLevel(level)
