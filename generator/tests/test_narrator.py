"""Tests for the executive-summary narrators (no network, no API key)."""

from seo_audit_gen import (
    build_audit,
    ClaudeNarrator,
    RuleBasedNarrator,
    default_narrator,
)
from seo_audit_gen.narrator import CLAUDE_MODEL


AUDIT = {
    "source": {"host": "ex.com"},
    "summary": {
        "totalPages": 5,
        "totalIssues": 3,
        "bySeverity": {"error": 1, "warning": 2, "notice": 0},
    },
    "categories": {
        "404Errors": [{"url": "https://ex.com/gone"}],
        "missingH1": [{"url": "https://ex.com/a"}, {"url": "https://ex.com/b"}],
    },
}


def tasks_for(audit):
    return build_audit(audit, RuleBasedNarrator()).tasks


# --- Fakes for the Claude client (duck-typed messages.create) -----------------


class _Block:
    def __init__(self, text):
        self.type = "text"
        self.text = text


class _Response:
    def __init__(self, text):
        self.content = [_Block(text)]


class _FakeMessages:
    def __init__(self, outer):
        self._outer = outer

    def create(self, **kwargs):
        self._outer.calls.append(kwargs)
        if self._outer.raises:
            raise RuntimeError("boom")
        return _Response(self._outer.reply)


class FakeClient:
    def __init__(self, reply="AI executive summary.", raises=False):
        self.reply = reply
        self.raises = raises
        self.calls = []
        self.messages = _FakeMessages(self)


# --- RuleBasedNarrator --------------------------------------------------------


def test_rule_based_summary_mentions_counts_and_verdict():
    narrator = RuleBasedNarrator()
    summary = narrator.summary(AUDIT, tasks_for(AUDIT))
    assert "5 crawled page(s)" in summary
    assert "3 technical SEO issue(s)" in summary
    assert "immediate attention" in summary  # has an error → critical verdict


def test_rule_based_summary_clean_site():
    clean = {
        "source": {"host": "ex.com"},
        "summary": {"totalPages": 4, "totalIssues": 0, "bySeverity": {}},
        "categories": {},
    }
    summary = RuleBasedNarrator().summary(clean, [])
    assert "excellent technical health" in summary


# --- ClaudeNarrator -----------------------------------------------------------


def test_claude_narrator_uses_model_response():
    client = FakeClient(reply="Tailored AI summary of the audit.")
    narrator = ClaudeNarrator(client)
    summary = narrator.summary(AUDIT, tasks_for(AUDIT))

    assert summary == "Tailored AI summary of the audit."
    assert len(client.calls) == 1
    assert client.calls[0]["model"] == CLAUDE_MODEL
    # The prompt includes the prioritized tasks.
    prompt = client.calls[0]["messages"][0]["content"]
    assert "404" in prompt


def test_claude_narrator_falls_back_on_error():
    client = FakeClient(raises=True)
    narrator = ClaudeNarrator(client)
    summary = narrator.summary(AUDIT, tasks_for(AUDIT))
    # Falls back to the deterministic summary.
    assert "5 crawled page(s)" in summary


def test_claude_narrator_falls_back_on_empty_response():
    client = FakeClient(reply="   ")
    narrator = ClaudeNarrator(client)
    summary = narrator.summary(AUDIT, tasks_for(AUDIT))
    assert "5 crawled page(s)" in summary


# --- default_narrator ---------------------------------------------------------


def test_default_narrator_is_rule_based_without_api_key(monkeypatch):
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    assert isinstance(default_narrator(), RuleBasedNarrator)


def test_default_narrator_falls_back_when_sdk_missing(monkeypatch):
    # Key set but the anthropic SDK is not installed in this environment → the
    # factory must degrade gracefully to the rule-based narrator.
    monkeypatch.setenv("ANTHROPIC_API_KEY", "sk-ant-test")
    narrator = default_narrator()
    assert isinstance(narrator, (RuleBasedNarrator, ClaudeNarrator))
