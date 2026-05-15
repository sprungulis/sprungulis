#!/usr/bin/env python3
"""
Parse a Python source file and build a JSON-serializable AST structure.
"""

from __future__ import annotations

import argparse
import ast
import json
import sys
from pathlib import Path
from typing import Any


def node_to_dict(node: ast.AST) -> dict[str, Any]:
    """Convert an AST node into a nested dictionary."""
    result: dict[str, Any] = {"_type": type(node).__name__}

    for field, value in ast.iter_fields(node):
        if isinstance(value, list):
            result[field] = [
                node_to_dict(item) if isinstance(item, ast.AST) else item
                for item in value
            ]
        elif isinstance(value, ast.AST):
            result[field] = node_to_dict(value)
        else:
            result[field] = value

    return result


def parse_file(path: Path) -> dict[str, Any]:
    """Read a Python file and return its AST as a nested dict."""
    source = path.read_text(encoding="utf-8")
    tree = ast.parse(source, filename=str(path))
    return {
        "source_file": str(path.resolve()),
        "root": node_to_dict(tree),
    }


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Build an AST structure from a Python source file.",
    )
    parser.add_argument(
        "file",
        type=Path,
        help="Path to the .py file to parse",
    )
    parser.add_argument(
        "-o",
        "--output",
        type=Path,
        help="Write JSON AST to this file (default: print to stdout)",
    )
    parser.add_argument(
        "--indent",
        type=int,
        default=2,
        help="JSON indentation (default: 2)",
    )
    args = parser.parse_args()

    if not args.file.is_file():
        print(f"Error: not a file: {args.file}", file=sys.stderr)
        return 1
    if args.file.suffix != ".py":
        print(f"Warning: {args.file} does not have a .py extension", file=sys.stderr)

    try:
        ast_structure = parse_file(args.file)
    except SyntaxError as exc:
        print(f"Syntax error in {args.file}: {exc}", file=sys.stderr)
        return 1

    json_text = json.dumps(ast_structure, indent=args.indent, ensure_ascii=False)

    if args.output:
        args.output.write_text(json_text, encoding="utf-8")
        print(f"AST written to {args.output}")
    else:
        print(json_text)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
