"""The client memory model and its ``memory.md`` (de)serialization.

``memory.md`` is the source of truth: a human-editable Markdown document with a
fixed set of ``##`` sections. Parsing is lenient (edit it by hand freely);
rendering is canonical (stable section order, empty sections shown explicitly).
"""

from __future__ import annotations

from dataclasses import dataclass, field

# Canonical section order, as they appear in memory.md.
SECTIONS: list[str] = [
    "Previous Audits",
    "Previous Reports",
    "Completed Tasks",
    "Developer Notes",
    "Meeting Notes",
    "Client Preferences",
    "Business Goals",
]

# The order memory is fed to the model — most decision-relevant first.
_CONTEXT_ORDER: list[str] = [
    "Business Goals",
    "Client Preferences",
    "Completed Tasks",
    "Previous Audits",
    "Previous Reports",
    "Developer Notes",
    "Meeting Notes",
]

_EMPTY_PLACEHOLDER = "_None yet._"


def _empty_sections() -> dict[str, list[str]]:
    return {title: [] for title in SECTIONS}


@dataclass
class ClientMemory:
    client_id: str
    host: str | None = None
    sections: dict[str, list[str]] = field(default_factory=_empty_sections)

    @classmethod
    def blank(cls, client_id: str, host: str | None = None) -> "ClientMemory":
        return cls(client_id=client_id, host=host, sections=_empty_sections())

    def add(self, section: str, entry: str) -> None:
        """Append a bullet entry to a section. Unknown sections are rejected."""
        if section not in self.sections:
            raise KeyError(
                f"Unknown memory section: {section!r}. "
                f"Valid sections: {', '.join(SECTIONS)}"
            )
        text = " ".join(entry.split())
        if text:
            self.sections[section].append(text)

    def is_empty(self) -> bool:
        return not any(self.sections.values())

    # --- Rendering ---------------------------------------------------------

    def to_markdown(self) -> str:
        lines = [f"# Client Memory — {self.client_id}", ""]
        if self.host:
            lines += [f"**Site:** {self.host}", ""]
        lines += [
            "<!-- Loaded before generating recommendations. Edit freely; "
            "keep the ## section headers. -->",
            "",
        ]
        for title in SECTIONS:
            lines.append(f"## {title}")
            lines.append("")
            items = self.sections.get(title, [])
            if items:
                lines.extend(f"- {item}" for item in items)
            else:
                lines.append(_EMPTY_PLACEHOLDER)
            lines.append("")
        return "\n".join(lines).rstrip() + "\n"

    def to_context(self) -> str:
        """Compact rendering of the non-empty sections, for the LLM prompt."""
        parts: list[str] = []
        for title in _CONTEXT_ORDER:
            items = self.sections.get(title, [])
            if items:
                parts.append(f"{title}:")
                parts.extend(f"- {item}" for item in items)
                parts.append("")
        if not parts:
            return ""
        header = f"Client memory for {self.client_id}"
        if self.host:
            header += f" ({self.host})"
        return header + "\n" + "\n".join(parts).rstrip()

    # --- Parsing -----------------------------------------------------------

    @classmethod
    def from_markdown(cls, text: str, client_id: str | None = None) -> "ClientMemory":
        memory = cls.blank(client_id or "unknown")
        current: str | None = None

        for raw in text.splitlines():
            line = raw.rstrip()
            stripped = line.strip()

            if stripped.startswith("# Client Memory"):
                # "# Client Memory — <id>"
                if "—" in stripped:
                    parsed = stripped.split("—", 1)[1].strip()
                    if parsed and client_id is None:
                        memory.client_id = parsed
                continue

            if stripped.startswith("**Site:**"):
                host = stripped[len("**Site:**") :].strip()
                memory.host = host or None
                continue

            if stripped.startswith("## "):
                title = stripped[3:].strip()
                current = title if title in memory.sections else None
                continue

            if current and stripped.startswith("- "):
                item = stripped[2:].strip()
                if item and item != _EMPTY_PLACEHOLDER:
                    memory.sections[current].append(item)

        return memory
