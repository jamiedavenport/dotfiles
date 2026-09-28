#!/bin/sh
set -eu

REPO_URL="https://github.com/jamiedavenport/dotfiles.git"
RAW_BASE="https://raw.githubusercontent.com/jamiedavenport/dotfiles/main"

if ! xcode-select -p >/dev/null 2>&1; then
	echo "Apple Command Line Tools are required."
	echo "Starting the installer. Re-run this bootstrap after installation finishes."
	xcode-select --install || true
	exit 1
fi

echo "Installing the repository-pinned mise launcher..."
installer_tmp_dir=$(mktemp -d)
trap 'rm -rf "$installer_tmp_dir"' EXIT HUP INT TERM

curl -fsSL "$RAW_BASE/bin/mise" -o "$installer_tmp_dir/mise"
chmod 755 "$installer_tmp_dir/mise"
mkdir -p "$HOME/.local/bin"
mv "$installer_tmp_dir/mise" "$HOME/.local/bin/mise"

"$HOME/.local/bin/mise" bootstrap \
	--from "$REPO_URL" \
	--skip repos \
	--yes

printf '\n%s\n' \
	"Initial bootstrap complete." \
	"Open a new terminal, configure GitHub SSH access, then run: mise bootstrap"
