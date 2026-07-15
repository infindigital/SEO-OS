"""Client memory system.

Every client carries a persistent, human-readable ``memory.md`` with seven
sections: Previous Audits, Previous Reports, Completed Tasks, Developer Notes,
Meeting Notes, Client Preferences, and Business Goals.

Memory is loaded before recommendations are generated so that guidance is
tailored to the client's goals and preferences and never re-recommends work
that is already done.
"""

from .model import ClientMemory, SECTIONS
from .store import load_memory, save_memory, memory_path, record_audit

__all__ = [
    "ClientMemory",
    "SECTIONS",
    "load_memory",
    "save_memory",
    "memory_path",
    "record_audit",
]
