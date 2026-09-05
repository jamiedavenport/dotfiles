# Repository instructions

## Overview

- This repository manages a personal macOS development environment with mise.
- `config.toml` declares tools, applications, dotfiles, bootstrap tasks, and
  macOS preferences.
- Files under `dotfiles/` are the version-controlled sources deployed to their
  corresponding paths in the home directory.
- `mise.lock` pins tool versions and platform-specific artifacts.

## Working conventions

- Run repository commands through `./bin/mise` so they use the pinned mise
  version.
- Edit the source under `dotfiles/`, not the deployed file in the home
  directory.
- Keep bootstrap behavior declarative and safe to run repeatedly.
- Preview bootstrap or dotfile changes before applying them to the workstation.
- Update `mise.lock` with mise commands when tool declarations change; do not
  edit generated lock data manually.

## Validation

- Run `./bin/mise bootstrap plan` after changing bootstrap configuration.
- Run `./bin/mise bootstrap status` to inspect current resource state.
- Run `./bin/mise bootstrap dotfiles diff` after changing managed dotfiles.
- Run `shellcheck scripts/configure-dock bin/mise` after changing shell scripts.
- Run `shfmt -d scripts/configure-dock bin/mise` after changing shell scripts.
- Do not run an applying command such as `./bin/mise bootstrap` or
  `./bin/mise bootstrap dotfiles apply` unless the task explicitly requires
  changing the workstation.
