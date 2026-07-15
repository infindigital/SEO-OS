"""AI audit generator.

Reads ``audit.json`` (from the analyzer) and generates two deliverables:

- ``technical-audit.md`` — an executive + technical audit report
- ``developer-tasks.md`` — prioritized, actionable tasks, each with a technical
  audit, business impact, SEO impact, recommended fix, priority, estimated
  time, and acceptance criteria

The structured task fields come from a curated SEO knowledge base
(deterministic, no hallucination). The executive summary is written by a
pluggable narrator: a rule-based default, or Claude when ``ANTHROPIC_API_KEY``
is configured.
"""

from .generate import build_audit, DeveloperTask, GeneratedAudit
from .knowledge import KNOWLEDGE_BASE, CategoryKnowledge
from .narrator import (
    Narrator,
    RuleBasedNarrator,
    ClaudeNarrator,
    default_narrator,
)

__all__ = [
    "build_audit",
    "DeveloperTask",
    "GeneratedAudit",
    "KNOWLEDGE_BASE",
    "CategoryKnowledge",
    "Narrator",
    "RuleBasedNarrator",
    "ClaudeNarrator",
    "default_narrator",
]
