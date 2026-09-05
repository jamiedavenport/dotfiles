# Raycast baseline

Raycast is the primary application launcher and productivity palette.

## First run

- Enable **Open at Login**.
- Keep the default **Option-Space** (`⌥ Space`) hotkey so Spotlight remains
  available at **Command-Space** (`⌘ Space`).
- Hide the menu bar icon once the global hotkey works reliably.
- Grant Accessibility access when prompted so window-management commands work.
- Sign in only when settings sync or paid features are needed.

## Defaults

- Use the system appearance.
- Keep fallback commands focused on applications, file search, and web search.
- Enable clipboard history only if its local retention is acceptable for the
  workstation's data.
- Add extensions, aliases, snippets, and command hotkeys only for established
  workflows.

## Backup and sync

Use Raycast's account sync when available. Otherwise, export an encrypted
`.rayconfig` file from **Settings → Advanced → Export** and store it outside
this repository. The export may contain clipboard history, AI chats, notes,
snippets, extensions, and other private data.

## Versioned boundary

This repository versions the Raycast package and this baseline. macOS privacy
permissions, login, account sync, extensions, hotkeys, and Raycast's Application
Support data remain account- or device-managed state.
