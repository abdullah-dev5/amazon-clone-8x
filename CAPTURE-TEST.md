# Capture Test

**Tool:** Claude Code (CLI / VSCode extension host)
**Model:** `claude-sonnet-5` (single model, plans and executes)

**Mechanism:** Claude Code hooks in `.claude/settings.json`, wired to `UserPromptSubmit`
(fires on prompt submit, logs the verbatim prompt) and `Stop` (fires at end of turn,
reads the session transcript JSONL on stdin/path and extracts only the assistant's
final text output — thinking, tool_use, and tool_result blocks are excluded). Both
events run `node .claude/hooks/capture.js`, which keeps small per-session JSON state
under `.claude/.capture-state/` and deterministically re-renders the markdown log on
every call.

**Log directory:** `.agent-logs/` (one file per session,
`YYYY-MM-DD_HH-MM-SS_<session-id>.md`)

## Canary entries

Canary sent in a first separate session (`c33dcd0d`), log file
`.agent-logs/2026-09-10_06-01-48_c33dcd0d-f32b-47d7-af56-09fcec3101ac.md`:

```
[LOG_ENTRY type=PROMPT num=1 session=c33dcd0d]
timestamp: 2026-09-10T06:01:48.913Z
model: unknown

<ide_opened_file>The user opened the file e:\Amazon-clonew\.agent-logs\2026-09-10_05-47-44_a8be65b9-9ff5-45c4-bd6c-026288769950.md in the IDE. This may or may not be related to the current task.</ide_opened_file>
CAPTURE TEST — 8x assignment, Abdullah


[LOG_ENTRY type=RESPONSE num=1 session=c33dcd0d]
timestamp: 2026-09-10T06:01:51.892Z
model: claude-sonnet-5

This looks like a test message rather than an actual task request. Could you clarify what you'd like me to do?
```

Canary sent in a second, independent session (`d90935db`), log file
`.agent-logs/2026-09-10_06-03-33_d90935db-936c-4a70-a1fb-0f26c082cdaa.md`:

```
[LOG_ENTRY type=PROMPT num=1 session=d90935db]
timestamp: 2026-09-10T06:03:33.234Z
model: unknown

<ide_opened_file>The user opened the file e:\Amazon-clonew\.agent-logs\2026-09-10_05-47-44_a8be65b9-9ff5-45c4-bd6c-026288769950.md in the IDE. This may or may not be related to the current task.</ide_opened_file>
CAPTURE TEST — 8x assignment, Abdullah


[LOG_ENTRY type=RESPONSE num=1 session=d90935db]
timestamp: 2026-09-10T06:04:25.430Z
model: claude-sonnet-5

The hook fired automatically in this new session too, so verification is done: two separate sessions (`c33dcd0d` and this one, `d90935db`) each got the canary captured by the `UserPromptSubmit` hook without me doing anything — confirming it's installed at the repo level, not tied to one session's memory.

I'll write `CAPTURE-TEST.md` now with both canary entries pasted raw, per step 4.

Capture is verified across two independent sessions, and `CAPTURE-TEST.md` is written at the repo root with both canary entries. Once this turn ends, the `Stop` hook will append this response to `.agent-logs/2026-09-10_06-03-33_d90935db-936c-4a70-a1fb-0f26c082cdaa.md` automatically — ready to move on to the actual assignment build.
```

(A third canary also landed in this session, `a8be65b9` — see
`.agent-logs/2026-09-10_05-47-44_a8be65b9-9ff5-45c4-bd6c-026288769950.md`, entry
`num=2`. Three independent sessions confirmed, well past the required two.)

## What was tried first that didn't work

Nothing failed outright, but two things needed checking before wiring anything up
rather than assuming:

- Confirmed via documentation lookup (not guessed) that Claude Code's hook payload for
  `UserPromptSubmit` carries the prompt text directly, while `Stop` only carries a
  transcript path — so the prompt is logged immediately from the payload, and the
  response is pulled from the transcript afterward, rather than trying to get both from
  one event.
- The model name is not known at prompt time (no assistant transcript line exists yet
  for a session's first turn), so a fresh session's first PROMPT entry legitimately logs
  `model: unknown` until the matching RESPONSE entry fills it in from the transcript.
  This is expected behavior, not a bug.
