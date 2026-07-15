"""Tests for the client memory model, markdown round-trip, and store."""

from client_memory import ClientMemory, SECTIONS, load_memory, record_audit, save_memory


def test_blank_has_all_seven_sections():
    memory = ClientMemory.blank("acme", host="acme.com")
    assert list(memory.sections) == SECTIONS
    assert len(SECTIONS) == 7
    assert memory.is_empty()


def test_add_and_reject_unknown_section():
    memory = ClientMemory.blank("acme")
    memory.add("Business Goals", "Grow organic revenue 30%")
    assert memory.sections["Business Goals"] == ["Grow organic revenue 30%"]
    assert not memory.is_empty()

    try:
        memory.add("Nonexistent Section", "x")
    except KeyError:
        pass
    else:  # pragma: no cover
        raise AssertionError("expected KeyError for unknown section")


def test_add_collapses_whitespace_and_ignores_blank():
    memory = ClientMemory.blank("acme")
    memory.add("Developer Notes", "  runs   on\n Next.js  ")
    memory.add("Developer Notes", "   ")
    assert memory.sections["Developer Notes"] == ["runs on Next.js"]


def test_markdown_round_trips():
    memory = ClientMemory.blank("acme", host="acme.com")
    memory.add("Business Goals", "Grow organic revenue 30%")
    memory.add("Completed Tasks", "Fixed all 404s")
    memory.add("Client Preferences", "Prefers concise task lists")

    reparsed = ClientMemory.from_markdown(memory.to_markdown())

    assert reparsed.client_id == "acme"
    assert reparsed.host == "acme.com"
    assert reparsed.sections == memory.sections


def test_markdown_shows_placeholder_for_empty_sections():
    md = ClientMemory.blank("acme").to_markdown()
    assert md.count("_None yet._") == 7
    for title in SECTIONS:
        assert f"## {title}" in md


def test_from_markdown_ignores_placeholder_lines():
    md = ClientMemory.blank("acme").to_markdown()
    parsed = ClientMemory.from_markdown(md, client_id="acme")
    assert parsed.is_empty()


def test_to_context_prioritizes_goals_and_skips_empty():
    memory = ClientMemory.blank("acme", host="acme.com")
    memory.add("Business Goals", "Grow organic revenue 30%")
    memory.add("Completed Tasks", "Fixed all 404s")

    context = memory.to_context()
    # Business Goals appears before Completed Tasks (context priority order).
    assert context.index("Business Goals") < context.index("Completed Tasks")
    # Empty sections are omitted entirely.
    assert "Meeting Notes" not in context
    assert "Grow organic revenue 30%" in context


def test_to_context_empty_when_no_entries():
    assert ClientMemory.blank("acme").to_context() == ""


def test_load_missing_returns_blank(tmp_path):
    memory = load_memory("ghost", clients_dir=tmp_path)
    assert memory.client_id == "ghost"
    assert memory.is_empty()


def test_save_then_load_round_trip(tmp_path):
    memory = ClientMemory.blank("acme", host="acme.com")
    memory.add("Meeting Notes", "Kickoff on 2026-06-05")
    path = save_memory(memory, clients_dir=tmp_path)

    assert path == tmp_path / "acme" / "memory.md"
    assert path.exists()

    loaded = load_memory("acme", clients_dir=tmp_path)
    assert loaded.host == "acme.com"
    assert loaded.sections["Meeting Notes"] == ["Kickoff on 2026-06-05"]


def test_record_audit_appends_previous_audit():
    memory = ClientMemory.blank("acme")
    record_audit(memory, "6 issues across 42 pages", date="2026-07-15")
    assert memory.sections["Previous Audits"] == [
        "2026-07-15 — 6 issues across 42 pages"
    ]
