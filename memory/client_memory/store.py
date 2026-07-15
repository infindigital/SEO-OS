"""Load and persist ``memory.md`` under ``clients/<clientId>/``."""

from __future__ import annotations

from pathlib import Path
from typing import Optional

from .model import ClientMemory

# Repo-root clients directory (memory/client_memory/store.py → repo root).
_DEFAULT_CLIENTS_DIR = Path(__file__).resolve().parents[2] / "clients"

MEMORY_FILENAME = "memory.md"


def _clients_dir(clients_dir: Optional[Path]) -> Path:
    return Path(clients_dir) if clients_dir is not None else _DEFAULT_CLIENTS_DIR


def memory_path(client_id: str, clients_dir: Optional[Path] = None) -> Path:
    return _clients_dir(clients_dir) / client_id / MEMORY_FILENAME


def load_memory(client_id: str, clients_dir: Optional[Path] = None) -> ClientMemory:
    """Load a client's memory, or a blank memory if none exists yet."""
    path = memory_path(client_id, clients_dir)
    if not path.exists():
        return ClientMemory.blank(client_id)
    return ClientMemory.from_markdown(path.read_text(encoding="utf-8"), client_id=client_id)


def save_memory(memory: ClientMemory, clients_dir: Optional[Path] = None) -> Path:
    path = memory_path(memory.client_id, clients_dir)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(memory.to_markdown(), encoding="utf-8")
    return path


def record_audit(
    memory: ClientMemory, summary: str, date: Optional[str] = None
) -> None:
    """Append an entry to the client's Previous Audits from an audit summary."""
    entry = f"{date} — {summary}" if date else summary
    memory.add("Previous Audits", entry)
