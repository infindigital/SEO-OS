"""Default reporting window for a sync run.

Search Console data lags a few days, so the default window ends ``lag`` days
before today and spans ``days`` days inclusive. Dates are ISO ``YYYY-MM-DD``.
``today`` is injectable so runs are deterministic in tests and workflows.
"""

from __future__ import annotations

from datetime import date, timedelta


def default_range(
    days: int = 28, lag: int = 3, today: date | None = None
) -> tuple[str, str]:
    """Return ``(start_date, end_date)`` for the default reporting window.

    ``days`` is the inclusive span (28 → four weeks). ``lag`` skips the most
    recent days, which Search Console has not finalized yet.
    """
    if days < 1:
        raise ValueError("days must be >= 1")
    if lag < 0:
        raise ValueError("lag must be >= 0")

    anchor = today or date.today()
    end = anchor - timedelta(days=lag)
    start = end - timedelta(days=days - 1)
    return start.isoformat(), end.isoformat()
