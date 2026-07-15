#!/usr/bin/env python3
"""Client memory CLI.

Manage a client's ``memory.md`` (Previous Audits, Previous Reports, Completed
Tasks, Developer Notes, Meeting Notes, Client Preferences, Business Goals).

Usage:
    python memory/run_memory.py init <client> [--host HOST]
    python memory/run_memory.py show <client>
    python memory/run_memory.py add  <client> "<section>" "<entry>"
    python memory/run_memory.py path <client>

Sections (quote them): "Previous Audits", "Previous Reports", "Completed Tasks",
"Developer Notes", "Meeting Notes", "Client Preferences", "Business Goals".
"""

from __future__ import annotations

import argparse
import sys

from client_memory import (
    ClientMemory,
    SECTIONS,
    load_memory,
    memory_path,
    save_memory,
)


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="run_memory.py", description="Manage per-client memory.md files."
    )
    parser.add_argument(
        "--clients-dir",
        default=None,
        help="Override the clients directory (default: repo clients/).",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    p_init = sub.add_parser("init", help="Create a blank memory.md for a client.")
    p_init.add_argument("client")
    p_init.add_argument("--host", default=None)

    p_show = sub.add_parser("show", help="Print a client's memory.md.")
    p_show.add_argument("client")

    p_add = sub.add_parser("add", help="Append an entry to a memory section.")
    p_add.add_argument("client")
    p_add.add_argument("section", help="One of the seven section titles (quoted).")
    p_add.add_argument("entry", help="The bullet text to append (quoted).")

    p_path = sub.add_parser("path", help="Print the path to a client's memory.md.")
    p_path.add_argument("client")

    return parser


def main() -> int:
    args = _build_parser().parse_args(sys.argv[1:])
    clients_dir = args.clients_dir

    if args.command == "init":
        path = memory_path(args.client, clients_dir)
        if path.exists():
            print(f"memory.md already exists at {path}", file=sys.stderr)
            return 1
        memory = ClientMemory.blank(args.client, host=args.host)
        saved = save_memory(memory, clients_dir)
        print(f"Created {saved}", file=sys.stderr)
        return 0

    if args.command == "show":
        print(load_memory(args.client, clients_dir).to_markdown(), end="")
        return 0

    if args.command == "add":
        if args.section not in SECTIONS:
            print(
                f"Error: unknown section {args.section!r}. "
                f"Valid sections: {', '.join(SECTIONS)}",
                file=sys.stderr,
            )
            return 1
        memory = load_memory(args.client, clients_dir)
        memory.add(args.section, args.entry)
        saved = save_memory(memory, clients_dir)
        print(f"Added to {args.section} in {saved}", file=sys.stderr)
        return 0

    if args.command == "path":
        print(memory_path(args.client, clients_dir))
        return 0

    return 2  # unreachable — subparser is required


if __name__ == "__main__":
    raise SystemExit(main())
