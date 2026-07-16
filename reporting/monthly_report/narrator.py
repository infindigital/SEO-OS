"""Executive-summary narrators for the monthly report.

The seven sections are always computed deterministically. Only the prose
Executive Summary is pluggable:

- :class:`RuleBasedNarrator` — deterministic, offline, always available.
- :class:`ClaudeNarrator` — uses Claude for a tailored summary, and falls back
  to the rule-based summary on any error or missing configuration.

:func:`default_narrator` picks Claude when ``ANTHROPIC_API_KEY`` is set and the
``anthropic`` SDK is importable, otherwise the rule-based narrator.
"""

from __future__ import annotations

import os
from typing import Protocol

# Latest, most capable model — used only when Claude narration is enabled.
CLAUDE_MODEL = "claude-opus-4-8"


class Narrator(Protocol):
    def summary(self, facts: "ReportFacts") -> str:  # pragma: no cover - protocol
        ...


class ReportFacts:
    """A compact, render-agnostic view of the report used to write prose.

    Built by the report builder from the assembled sections so both narrators
    (and their prompt) work from the same numbers.
    """

    def __init__(
        self,
        *,
        client: str,
        period: str,
        traffic_users,
        sessions,
        conversions,
        clicks,
        keywords,
        completed: int,
        open_tasks: int,
        completion_pct: float,
        issues_resolved: int,
        issues_remaining: int,
        roadmap: list[str],
    ):
        self.client = client
        self.period = period
        self.traffic_users = traffic_users
        self.sessions = sessions
        self.conversions = conversions
        self.clicks = clicks
        self.keywords = keywords
        self.completed = completed
        self.open_tasks = open_tasks
        self.completion_pct = completion_pct
        self.issues_resolved = issues_resolved
        self.issues_remaining = issues_remaining
        self.roadmap = roadmap


def _trend_clause(delta) -> str:
    """A human clause for a MetricDelta, e.g. 'up 12.0% to 1,200'."""
    value = f"{delta.current:,}" if isinstance(delta.current, int) else f"{delta.current:,.1f}"
    if delta.direction == "new" or delta.pct is None:
        return f"{value}"
    arrow = "up" if delta.direction == "up" else "down" if delta.direction == "down" else "flat at"
    if delta.direction == "flat":
        return f"flat at {value}"
    return f"{arrow} {abs(delta.pct)}% to {value}"


class RuleBasedNarrator:
    """Deterministic executive summary composed from the report's numbers."""

    def summary(self, facts: ReportFacts) -> str:
        period = f" in {facts.period}" if facts.period else ""
        lead = (
            f"This report summarizes SEO performance for {facts.client}{period}. "
            f"Organic search traffic reached {_trend_clause(facts.clicks)} clicks, "
            f"with {_trend_clause(facts.traffic_users)} users and "
            f"{_trend_clause(facts.sessions)} sessions across the site."
        )

        work = (
            f" The team completed {facts.completed} task(s) this period"
            f" ({facts.completion_pct}% of tracked work), "
            f"resolving {facts.issues_resolved} technical issue(s)"
        )
        if facts.issues_remaining:
            work += f" with {facts.issues_remaining} remaining"
        work += "."

        if facts.roadmap:
            focus = "; ".join(facts.roadmap[:3])
            ahead = f" Next month focuses on: {focus}."
        else:
            ahead = " Next month continues to build on this momentum."

        return (lead + work + ahead).strip()


class ClaudeNarrator:
    """Claude-written executive summary, with a rule-based fallback.

    ``client`` is any object exposing ``messages.create(...)`` (the Anthropic
    SDK client, or a test double). Dependency-injected so the summary path is
    testable without network access or an API key.
    """

    def __init__(self, client, fallback: Narrator | None = None, model: str = CLAUDE_MODEL):
        self._client = client
        self._fallback = fallback or RuleBasedNarrator()
        self._model = model

    def summary(self, facts: ReportFacts) -> str:
        try:
            return self._generate(facts)
        except Exception:  # noqa: BLE001 — never fail the report over narration.
            return self._fallback.summary(facts)

    def _generate(self, facts: ReportFacts) -> str:
        response = self._client.messages.create(
            model=self._model,
            max_tokens=500,
            system=(
                "You are a senior SEO account manager writing the executive "
                "summary of a monthly client report. Be concise, specific, and "
                "business-focused. Write 3–5 sentences of plain prose — no "
                "headings, no lists, no preamble. Ground every claim in the "
                "numbers provided; do not invent figures."
            ),
            messages=[{"role": "user", "content": _build_prompt(facts)}],
        )
        text = "".join(
            getattr(block, "text", "")
            for block in getattr(response, "content", [])
            if getattr(block, "type", None) == "text"
        ).strip()
        if not text:
            raise ValueError("Empty response from Claude")
        return text


def _build_prompt(facts: ReportFacts) -> str:
    lines = [
        f"Client: {facts.client}",
        f"Period: {facts.period or 'this month'}",
        "",
        "Metrics (current vs previous period):",
        f"- Organic clicks: {facts.clicks.to_dict()}",
        f"- Users: {facts.traffic_users.to_dict()}",
        f"- Sessions: {facts.sessions.to_dict()}",
        f"- Conversions: {facts.conversions.to_dict()}",
        f"- Ranking keywords: {facts.keywords.to_dict()}",
        "",
        f"Work: {facts.completed} completed, {facts.open_tasks} open "
        f"({facts.completion_pct}% complete).",
        f"Technical issues: {facts.issues_resolved} resolved, "
        f"{facts.issues_remaining} remaining.",
        "",
        "Planned next month: " + ("; ".join(facts.roadmap) if facts.roadmap else "n/a"),
        "",
        "Write the executive summary of this monthly SEO report.",
    ]
    return "\n".join(lines)


def default_narrator() -> Narrator:
    """Claude narrator when configured; otherwise the deterministic one."""
    if not os.environ.get("ANTHROPIC_API_KEY"):
        return RuleBasedNarrator()
    try:
        import anthropic  # noqa: F401 — presence check + client construction.

        return ClaudeNarrator(anthropic.Anthropic(), fallback=RuleBasedNarrator())
    except Exception:  # noqa: BLE001 — SDK missing or client init failed.
        return RuleBasedNarrator()
