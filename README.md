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
installation when necessary. If that installer opens, wait for it to finish and
then run the command again.

The bootstrap downloads the repository-pinned mise launcher to
`~/.local/bin/mise`, clones this repository to `~/.config/mise`, and configures
packages, dotfiles, macOS preferences, developer tools, Cursor extensions, the
Dock, and the account photo. Cloning the additional development repositories is
deliberately deferred because `sidequest` is private and a new Mac does not have
GitHub credentials yet.

### GitHub access

After the initial bootstrap:

1. Open a new terminal so `.zprofile` adds `~/.local/bin` to `PATH`.
2. Sign in to 1Password and restore or create `~/.ssh/id_ed25519`.
3. Add the public key to GitHub if it is a new key.
4. Verify authentication with `ssh -T git@github.com`.
5. Run `mise bootstrap` to clone the configured repositories.

### Claude Code

Claude Code's user configuration lives in `dotfiles/claude/`:

- `CLAUDE.md` holds the global instructions.
- `settings.json` is copied to `~/.claude/settings.json`. Capture changes made
  from `/config` with `./bin/mise bootstrap dotfiles add --changed`.
- `agents/`, `rules/`, and `skills/` are symlinked from `~/.claude/`, so new
  ones created in Claude Code land in this repository. Content installed by
  apps (tldraw) or synced from claude.ai is ignored by Git.
- `mcp.json` lists the user-scope MCP servers. Claude Code stores them in
  `~/.claude.json` with runtime state, so bootstrap registers them through the
  `claude` CLI instead. Run `./bin/mise run claude:mcp` after editing the list.

OAuth credentials stay on the workstation; no API key is stored in this
repository. Authenticate each server once from `/mcp` in Claude Code, and
verify them with `./bin/mise exec -- claude mcp list`.

The bootstrap is safe to run again. It skips resources that are already in the
desired state, while the small imperative bootstrap task is written to be
idempotent.

## Common mise commands

The bootstrap installs `mise` and configures it on `PATH` for new login shells.
Run these commands from the repository root:

```sh
mise bootstrap plan              # Preview setup changes
mise bootstrap                   # Apply the complete configuration
mise bootstrap status            # Check bootstrap resource status
mise install --locked             # Install tools from the lockfile

mise bootstrap dotfiles status   # Check managed dotfiles
mise bootstrap dotfiles diff     # Preview dotfile changes
mise bootstrap dotfiles apply    # Deploy managed dotfiles

mise run check                    # Run all read-only repository checks

mise outdated                     # Check for newer tool versions
mise lock --bump --dry-run        # Preview lockfile updates
mise lock --bump                  # Update pinned versions and artifacts
```

Re-running `bootstrap` is safe: declarative resources already in their desired
state are skipped. Edit `config.toml` or files under `dotfiles/`, preview the
result, apply it, and commit the resulting `mise.lock` changes when applicable.

`mise run check` runs ShellCheck and shfmt, verifies that mise loads this
repository's configuration, previews bootstrap changes, and reports managed
dotfile drift. It does not apply changes to the workstation.

### Account photo

`dotfiles/macos/profile-photo.png` is copied from
`~/jamiedavenport.me/public/images/jamie.png`. Replace this managed source to
change the photo used by future bootstraps.

```sh
./bin/mise run profile-photo -- --dry-run  # Preview the account photo change
./bin/mise run profile-photo              # Set only the account photo
```

The task uses Apple's Swift and OpenDirectory frameworks, provided by the
existing Command Line Tools prerequisite. It sets the current local user's
picture path and embeds JPEG data in the account record so the login photo
does not depend on reading the home directory. It compares the actual account
attributes before writing, verifies the result, and attempts to restore any
attributes it changed if an update fails.

`bootstrap` runs the task; `check` type-checks it and runs its read-only preview.
`mise bootstrap plan` only previews declarative resources, so use the command
above to preview this task. The photo may require signing out and back in to
appear in an already-open login or settings view.

### Cap screen capture

Bootstrap installs Cap from its official DMG, selecting Apple Silicon or Intel
automatically (including when running under Rosetta). This avoids an extraction
issue with the extensionless archive used by Cap's Homebrew cask in the pinned
mise version. The installer checks the app's identity, signature, and Gatekeeper
assessment before copying it into `/Applications`; it uses `sudo` if needed.
Existing Cap installations are left in place and use Cap's own updater.

```sh
./bin/mise run install-cap -- --dry-run  # Preview the Cap installation
./bin/mise run install-cap              # Install only Cap
```

`mise bootstrap plan` previews declarative resources; the Cap installer runs in
the bootstrap task. `mise run check` also runs its read-only preview. New installs
use the current official release rather than a version pinned in `mise.lock`.
Launch Cap after installation to grant screen recording and microphone access
as needed.

## Updating mise

`bin/mise` is generated by mise and pins the launcher version used by this
repository. Regenerate it rather than editing it by hand:

```sh
mise generate install-script --version <version> --write ./bin/mise
```

After regenerating it, run `mise run check`. Keep the version in the command
explicit so a fresh machine gets the reviewed release rather than whatever is
latest at installation time.

## Contents

- `config.toml` declares tools, applications, dotfiles, and macOS preferences.
- `mise.lock` pins tool versions and platform-specific artifacts.
- `bin/mise` is the generated, repository-pinned mise launcher used during
  initial installation.
- `dotfiles/` contains configuration for Zsh, Git, SSH, Cursor, Neovim, Claude Code, Ghostty,
  Starship, Raycast, and the browser baseline.

Local mise overrides and temporary files are intentionally ignored by Git.
