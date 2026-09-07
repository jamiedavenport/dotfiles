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
packages, dotfiles, macOS preferences, developer tools, Cursor extensions, and
the Dock. Cloning the additional development repositories is deliberately
deferred because `sidequest` is private and a new Mac does not have GitHub
credentials yet.

### GitHub access

After the initial bootstrap:

1. Open a new terminal so `.zprofile` adds `~/.local/bin` to `PATH`.
2. Sign in to 1Password and restore or create `~/.ssh/id_ed25519`.
3. Add the public key to GitHub if it is a new key.
4. Verify authentication with `ssh -T git@github.com`.
5. Run `mise bootstrap` to clone the configured repositories.

### Jamie's personal bootstrap

The public bootstrap installs Node, fnox, and the 1Password CLI. Paid ui.sh skills
are installed separately, directly into `~/.agents/skills/` for global Codex
discovery. Their content and your token must never be committed to this repo.

After the initial bootstrap:

1. Sign into the 1Password desktop app and enable **Settings → Developer →
   Integrate with 1Password CLI**.
2. Store the ui.sh installer token in the `Token` field of the `ui.sh` item in
   your private `Personal` vault (`op://Personal/ui.sh/Token`).
3. Preview, then run the personal bootstrap:

```sh
./bin/mise run bootstrap:jamie -- --dry-run
./bin/mise run bootstrap:jamie
```

`fnox.toml` contains only the vault reference. The installer uses the `ui-sh`
profile through `fnox exec`; the token is never loaded by normal shell startup,
the public bootstrap, or `check`. Authentication failure stops the personal
installation without replacing existing skills. The task loads this repo's
explicit fnox config in isolation; edit its reference if the item moves.

A complete installation is preserved without authentication or downloading.
If you previously installed the nine skills manually, explicitly adopt them
once to record their hashes and restrict their permissions:

```sh
./bin/mise run bootstrap:jamie -- --adopt --dry-run
./bin/mise run bootstrap:jamie -- --adopt
```

Adoption trusts that those existing folders are your ui.sh installation. It
does not authenticate or verify them against the service. New downloads are
validated and get a manifest automatically.

To fetch all currently available skills, including newly released ones:

```sh
./bin/mise run skills:update -- --dry-run
./bin/mise run skills:update
```

Dry runs inspect local state only; they do not fetch an upstream diff. An update
downloads into a private staging directory, reports changes, then applies them.
It refuses to overwrite untracked or locally modified skills whose contents
differ from the download. Previously managed skills no longer returned by ui.sh
are retained. Download failures preserve existing skills, and installation
failures attempt to restore replaced folders.

The private manifest at `~/.local/state/ui-sh/manifest.json` records file hashes
and timestamps. Downloads never enter the repo, and installed skill directories
and files use owner-only permissions. Other agents running as your macOS user
may also discover `~/.agents/skills/`.

The installer is pinned to `@uidotsh/install@0.2.0`; ui.sh's downloaded skill
content is not version-pinned. Its CLI requires the token as a process argument,
so it can be visible to process inspection during installation. Installer output
is not echoed, npm debug logs are disabled for that invocation, and downloaded
files containing the token are rejected.

`check` tests failure and update behavior with synthetic fixtures and rejects
tracked paid skill paths or ui.sh `SKILL.md` files. Ignore rules also cover the
previous skill paths and local fnox overrides. Do not force-add commercial
content or publish installation archives.

Implementation references: [fnox 1Password](https://fnox.jdx.dev/providers/1password.html),
[fnox configuration](https://fnox.jdx.dev/reference/configuration.html),
[ui.sh installation](https://ui.sh/skills/design), and
[mise bootstrap](https://github.com/jdx/mise/blob/main/docs/cli/bootstrap.md).
Documentation was checked through Context7 IDs `/jdx/mise` (requested mise
`2026.9.1` compatibility) and `/jdx/fnox`, plus fnox `1.35.1` documentation and
ui.sh installer `0.2.0` CLI help.

### Context7 access

Codex uses the hosted Context7 MCP server for current third-party library and
API documentation. Its configuration is versioned, but OAuth credentials stay
on the workstation.

After the initial bootstrap, authenticate once:

```sh
codex mcp login context7
```

Complete the browser login, start a new Codex thread, and verify the connection
with `codex mcp list` or `/mcp` in the Codex terminal UI. No Context7 API key is
stored in this repository.

### Sidequest access

Codex uses the hosted [Sidequest MCP server](https://github.com/jamiedavenport/sidequest/blob/main/docs/mcp.md)
at `https://sdqst.app/mcp`. After the initial bootstrap, authenticate once:

```sh
./bin/mise exec -- codex mcp login sidequest
```

Complete the browser email-code login and choose read access or allow task
changes. Start a new Codex thread and verify the connection with
`./bin/mise exec -- codex mcp list` or `/mcp` in the Codex terminal UI.
OAuth credentials stay on the workstation. Manage or revoke access at
[Sidequest connections](https://sdqst.app/connections).

The hosted MCP endpoint must be enabled before login can succeed. If the endpoint
or OAuth discovery returns HTTP 404, follow Sidequest's deployment instructions
to enable MCP, then retry the login.

### Polar access

Codex uses the hosted [Polar MCP server](https://polar.sh/docs/integrate/mcp)
at `https://mcp.polar.sh/mcp/polar-mcp` for the live Polar organization.
After the initial bootstrap, authenticate once:

```sh
./bin/mise exec -- codex mcp login polar
```

The `polar-sandbox` server uses `https://mcp.polar.sh/mcp/polar-sandbox`
for testing. Authenticate it separately:

```sh
./bin/mise exec -- codex mcp login polar-sandbox
```

Complete the browser login and authorize access to your organization. Start a
new Codex thread and verify the connection with
`./bin/mise exec -- codex mcp list` or `/mcp` in the Codex terminal UI.
OAuth credentials stay on the workstation; no API key is stored in this repository.

If sandbox login reports `OAuth authorization endpoint origin does not match the
authorization server origin without issuer-bound callbacks`, Polar's sandbox
OAuth discovery metadata is incompatible with Codex's validation. The server
is configured, but authentication is blocked by this compatibility issue.
The same error is reported for Polar in
[Codex issue #41362](https://github.com/openai/codex/issues/41362#issuecomment-5462330681).
Retry login after a compatible fix is available in Codex or Polar.

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
- `dotfiles/` contains configuration for Zsh, Git, SSH, Cursor, Codex, Ghostty,
  Starship, Raycast, and the browser baseline.

Local mise overrides and temporary files are intentionally ignored by Git.
