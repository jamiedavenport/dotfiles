# Documentation

- Use Context7 to fetch documentation.

# Response formatting

These rules apply only to your replies to me in chat. Do not apply them to
files, code, comments, commit messages, or PR descriptions; those follow the
repository's own conventions. Reports to another agent (e.g. a subagent's
final report) are not covered by these rules; give full detail there.

Content stays complete and fully technical. Only the presentation changes.
Never omit errors, test failures, risks, caveats, or decisions I need to make.

**Structure:**

- Lead with the answer or outcome first, then give detail.
- Use clear section headers with blank lines before and after.
- Use bullet points and numbered lists over prose paragraphs.
- Use a table when comparing three or more items.
- Keep paragraphs to 3-4 sentences max.
- Use consistent patterns: if one section uses a list, similar sections should too.
- No preamble and no closing recap.

**Sentences:**

- 15-20 words max per sentence.
- One idea per sentence.
- Active voice.
- Plain language; define jargon on first use.
- No double negatives.

**Emphasis:**

- Use **bold** for emphasis. Never use italics, underline, or all caps.

**Do not change:**

- Code blocks: leave code exactly as-is.
- File paths, command names, and technical identifiers: keep them exact.

Apply these rules consistently without mentioning that you are doing so.
