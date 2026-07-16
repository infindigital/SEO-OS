"""Validate the agent definitions against their manifest.

Keeps ``agents/definitions/manifest.json`` and the Markdown definitions in
sync: every agent has a definition file that carries all five required
sections, ids are unique, the expected roster is present, and every
collaborator reference resolves.
"""

import json
from pathlib import Path

import pytest

DEFINITIONS = Path(__file__).resolve().parents[1] / "definitions"
MANIFEST = DEFINITIONS / "manifest.json"

REQUIRED_SECTIONS = ["Role", "Responsibilities", "Rules", "SOP", "Output Format"]

EXPECTED_IDS = {
    "seo-director",
    "technical-seo",
    "content-strategist",
    "local-seo",
    "link-building",
    "reporting",
    "qa",
    "developer-reviewer",
}


@pytest.fixture(scope="module")
def manifest() -> dict:
    return json.loads(MANIFEST.read_text(encoding="utf-8"))


def test_manifest_lists_exactly_the_expected_roster(manifest):
    ids = [agent["id"] for agent in manifest["agents"]]
    assert len(ids) == len(set(ids)), "duplicate agent ids in manifest"
    assert set(ids) == EXPECTED_IDS


def test_manifest_section_order_matches_required_sections(manifest):
    assert manifest["sectionOrder"] == REQUIRED_SECTIONS


def test_exactly_one_orchestrator(manifest):
    orchestrators = [a["id"] for a in manifest["agents"] if a.get("orchestrator")]
    assert orchestrators == ["seo-director"]


@pytest.mark.parametrize("agent_id", sorted(EXPECTED_IDS))
def test_each_definition_exists_with_all_sections(manifest, agent_id):
    agent = next(a for a in manifest["agents"] if a["id"] == agent_id)
    path = DEFINITIONS / agent["definition"]
    assert path.exists(), f"missing definition file for {agent_id}"

    text = path.read_text(encoding="utf-8")
    for section in REQUIRED_SECTIONS:
        assert f"## {section}" in text, f"{agent_id} is missing '## {section}'"

    # Identity and non-empty metadata.
    assert agent["name"]
    assert agent["role"]
    assert agent["consumes"], f"{agent_id} declares no consumed artifacts"
    assert agent["produces"], f"{agent_id} declares no produced outputs"


def test_collaborator_references_resolve(manifest):
    ids = {a["id"] for a in manifest["agents"]}
    for agent in manifest["agents"]:
        for other in agent["collaboratesWith"]:
            assert other in ids, f"{agent['id']} references unknown agent {other!r}"
            assert other != agent["id"], f"{agent['id']} lists itself as a collaborator"


def test_no_orphan_definition_files(manifest):
    """Every <id>.md in definitions/ is referenced by the manifest."""
    referenced = {a["definition"] for a in manifest["agents"]}
    on_disk = {p.name for p in DEFINITIONS.glob("*.md") if p.name != "README.md"}
    assert on_disk == referenced
