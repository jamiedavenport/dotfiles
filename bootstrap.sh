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

if [ ! -x "$HOME/.local/bin/mise" ]; then
  echo "Installing the repository-pinned mise release..."
  curl -fsSL "$RAW_BASE/bin/mise" | sh
fi

exec "$HOME/.local/bin/mise" bootstrap \
  --from-git "$REPO_URL" \
  --yes