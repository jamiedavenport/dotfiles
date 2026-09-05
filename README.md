# Dotfiles

Personal macOS development environment managed by [mise](https://mise.jdx.dev/).
It installs command-line tools and applications, deploys configuration files,
and applies a small set of macOS preferences.

## Bootstrap

On a new Mac, run:

```sh
curl -fsSL https://raw.githubusercontent.com/jamiedavenport/dotfiles/main/bootstrap.sh | sh
```

Apple Command Line Tools are required; the bootstrap script prompts for their
installation when necessary.

## Common mise commands

Run commands from the repository root with `./bin/mise` to use the pinned mise
version:

```sh
mise bootstrap plan              # Preview setup changes
mise bootstrap                   # Apply the complete configuration
mise bootstrap status            # Check bootstrap resource status
mise install --locked             # Install tools from the lockfile

mise bootstrap dotfiles status   # Check managed dotfiles
mise bootstrap dotfiles diff     # Preview dotfile changes
mise bootstrap dotfiles apply    # Deploy managed dotfiles

mise outdated                     # Check for newer tool versions
mise lock --bump --dry-run        # Preview lockfile updates
mise lock --bump                  # Update pinned versions and artifacts
```

Re-running `bootstrap` is safe: declarative resources already in their desired
state are skipped. Edit `config.toml` or files under `dotfiles/`, preview the
result, apply it, and commit the resulting `mise.lock` changes when applicable.

## Contents

- `config.toml` declares tools, applications, dotfiles, and macOS preferences.
- `mise.lock` pins tool versions and platform-specific artifacts.
- `bin/mise` provides the repository-pinned mise executable.
- `dotfiles/` contains configuration for Zsh, Git, SSH, Cursor, Codex, Ghostty,
  Starship, Raycast, and the browser baseline.

Local mise overrides and temporary files are intentionally ignored by Git.
