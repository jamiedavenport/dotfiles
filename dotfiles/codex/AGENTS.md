# Global development instructions

## Working style

- Read the relevant existing code before changing it.
- Prefer the smallest coherent change.
- Preserve established project conventions.
- Do not modify unrelated files.
- Explain meaningful architectural tradeoffs.
- Do not add dependencies without a clear reason.

## Validation

- Run the most relevant tests after changes.
- Run the repository's formatter, linter, and type checker when available.
- Report validation you could not run.

## Documentation

- When work depends on current third-party library or API documentation, use
  Context7 before general web search.
- Include the exact Context7 library ID and requested version when known.
- Do not use Context7 for repository-local code or OpenAI product
  documentation.

## Git

- Do not force-push.
- Do not rewrite existing history unless explicitly requested.
- Do not create commits unless explicitly requested.
- Keep unrelated changes out of the same patch.

## Project instructions

- Treat each repository's AGENTS.md as the source of truth for
  repository-specific commands, architecture, and conventions.
