# Browser baseline

Primary browser: Dia Free

Dia is the minimal browsing layer. Keep AI work in the dedicated ChatGPT,
Codex, and Cursor applications rather than connecting browser activity to
additional services.

## First run

- Sign in to Dia and let the Better Days trial expire without subscribing.
- In Privacy settings, turn off content-data sharing, personalization, and
  memory.
- Do not connect services such as email, calendar, Slack, Notion, or GitHub.
- Import bookmarks from the previous browser, but not passwords, history, or
  extensions.
- Install the 1Password extension and sign in.
- Verify normal browsing, local development sites, downloads, and video calls
  before making Dia the default browser.
- Remove Firefox from the workstation only after the migration is verified.

## Sync

Enable sync for:

- bookmarks
- profiles

Choose deliberately whether to sync:

- open tabs

Keep passwords in 1Password rather than Dia.

## Appearance

- Follow system light/dark appearance.
- Use the sidebar or top tab layout based on utility, not novelty.
- Keep pinned tabs and tab groups limited to durable workflows.

## Extensions

Keep 1Password as the only default extension. Dia provides native ad and
tracker blocking, so do not install a second content blocker.

Add a development-specific extension only when a concrete workflow requires
it, and remove it when that need ends.

## Versioned boundary

This repository versions the Dia package, Dock placement, and this baseline.
Account login, browser profiles, sync, extensions, site permissions, and the
default-browser selection remain account- or device-managed state. Do not
version Dia's Application Support directory or Chromium profile databases.
