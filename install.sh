#!/usr/bin/env bash
# Install the wordpress-theme-builder skill into ~/.claude/skills
# Usage: ./install.sh [--copy] [--uninstall]

set -euo pipefail

SOURCE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/skill"
SKILLS_DIR="${HOME}/.claude/skills"
TARGET="${SKILLS_DIR}/wordpress-theme-builder"

if [[ "${1:-}" == "--uninstall" ]]; then
	if [[ -e "$TARGET" || -L "$TARGET" ]]; then
		rm -rf "$TARGET"
		echo "Removed $TARGET"
	else
		echo "Nothing installed at $TARGET"
	fi
	exit 0
fi

if [[ ! -f "$SOURCE/SKILL.md" ]]; then
	echo "skill/SKILL.md not found next to this script." >&2
	exit 1
fi

mkdir -p "$SKILLS_DIR"
rm -rf "$TARGET"

if [[ "${1:-}" == "--copy" ]]; then
	cp -R "$SOURCE" "$TARGET"
	echo "Copied skill to $TARGET"
else
	ln -s "$SOURCE" "$TARGET"
	echo "Symlinked $TARGET -> $SOURCE"
fi

echo
echo "Restart Claude Code. Try: /wordpress-theme-builder new my-theme"
