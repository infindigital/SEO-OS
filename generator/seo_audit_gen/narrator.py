"""Executive-summary narrators.

The structured task fields are always deterministic (knowledge base). Only the
prose executive summary is pluggable:

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
    def summary(self, audit: dict, tasks: list) -> str:  # pragma: no cover - protocol
        ...


def _health_verdict(total_issues: int, errors: int) -> str:
    if total_issues == 0:
        return "The site is in excellent technical health with no issues detected"
    if errors > 0:
        return "The site has critical technical issues that need immediate attention"
    if total_issues >= 10:
        return "The site has a number of technical issues worth prioritizing"
    return "The site is in reasonable technical health with some issues to address"


class RuleBasedNarrator:
    """Deterministic executive summary composed from the audit's counts."""

    def summary(self, audit: dict, tasks: list) -> str:
        summary = audit.get("summary", {}) or {}
        source = audit.get("source", {}) or {}
        by_severity = summary.get("bySeverity", {}) or {}

        total_pages = summary.get("totalPages", 0)
        total_issues = summary.get("totalIssues", 0)
        errors = by_severity.get("error", 0)
        warnings = by_severity.get("warning", 0)
        notices = by_severity.get("notice", 0)
        host = source.get("host") or source.get("startUrl") or "the site"

        verdict = _health_verdict(total_issues, errors)
        lead = (
            f"This audit reviewed {total_pages} crawled page(s) of {host} and "
            f"found {total_issues} technical SEO issue(s) "
            f"({errors} error, {warnings} warning, {notices} notice). {verdict}."
        )

        if not tasks:
            return lead + " No developer tasks were generated."

        top = tasks[0]
        priorities = ", ".join(
            f"{task.priority} {task.title.lower()}" for task in tasks[:3]
        )
        return (
            f"{lead} The work breaks down into {len(tasks)} prioritized task(s); "
            f"the highest-impact item is \"{top.title}\" ({top.priority}). "
            f"Recommended focus order: {priorities}."
        )


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

    def summary(self, audit: dict, tasks: list) -> str:
        try:
            return self._generate(audit, tasks)
        except Exception:  # noqa: BLE001 — never fail the audit over narration.
            return self._fallback.summary(audit, tasks)

    def _generate(self, audit: dict, tasks: list) -> str:
        prompt = _build_prompt(audit, tasks)
        response = self._client.messages.create(
            model=self._model,
            max_tokens=500,
            system=(
                "You are a senior technical SEO consultant writing the executive "
                "summary of an audit for an agency client. Be concise, specific, "
                "and business-focused. Write 3–5 sentences of plain prose — no "
                "headings, no lists, no preamble."
            ),
            messages=[{"role": "user", "content": prompt}],
        )
        text = "".join(
            getattr(block, "text", "")
            for block in getattr(response, "content", [])
            if getattr(block, "type", None) == "text"
        ).strip()
        if not text:
            raise ValueError("Empty response from Claude")
        return text


def _build_prompt(audit: dict, tasks: list) -> str:
    summary = audit.get("summary", {}) or {}
    source = audit.get("source", {}) or {}
    lines = [
        f"Site: {source.get('host') or source.get('startUrl') or 'unknown'}",
        f"Pages crawled: {summary.get('totalPages', 0)}",
        f"Total issues: {summary.get('totalIssues', 0)}",
        f"By severity: {summary.get('bySeverity', {})}",
        "",
        "Prioritized tasks (most important first):",
    ]
    for task in tasks:
        lines.append(
            f"- [{task.priority}] {task.title}: {task.technical_audit} "
            f"(est. {task.estimated_time})"
        )
    lines.append(
        "\nWrite the executive summary of this technical SEO audit."
    )
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
