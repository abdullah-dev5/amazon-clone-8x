#!/usr/bin/env node
/*
 * Automatic prompt/response capture for the 8x assignment.
 * Wired to two Claude Code hooks (see .claude/settings.json):
 *   - UserPromptSubmit: fires when the user submits a prompt. Logs the
 *     verbatim prompt text immediately (from the hook payload, not the
 *     transcript, since the transcript may not have flushed it yet).
 *   - Stop: fires when Claude finishes responding. Reads the session
 *     transcript (JSONL) to pull out only the assistant's final text
 *     output for the turn (skipping thinking/tool_use/tool_result blocks)
 *     and pairs it with the matching prompt entry.
 *
 * State for a session (entries collected so far, output filename, last
 * known model) is kept in a small JSON sidecar under
 * .claude/.capture-state/<session_id>.json so the markdown log file can be
 * deterministically re-rendered on every hook call without ever mutating
 * the text of a previously written entry.
 */

const fs = require("fs");
const path = require("path");

function readStdin() {
  try {
    return fs.readFileSync(0, "utf8");
  } catch (e) {
    return "";
  }
}

function nowIso() {
  return new Date().toISOString();
}

function readJsonLines(filePath) {
  let raw;
  try {
    raw = fs.readFileSync(filePath, "utf8");
  } catch (e) {
    return [];
  }
  const out = [];
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      out.push(JSON.parse(trimmed));
    } catch (e) {
      // skip malformed/partial lines
    }
  }
  return out;
}

function isHumanTextTurn(obj) {
  return (
    obj &&
    obj.type === "user" &&
    obj.message &&
    obj.message.role === "user" &&
    Array.isArray(obj.message.content) &&
    obj.message.content.some((c) => c && c.type === "text")
  );
}

function humanTextOf(obj) {
  return obj.message.content
    .filter((c) => c && c.type === "text")
    .map((c) => c.text)
    .join("\n\n");
}

function detectModelFromTranscript(transcriptPath) {
  const lines = readJsonLines(transcriptPath);
  for (let i = lines.length - 1; i >= 0; i--) {
    const obj = lines[i];
    if (obj.type === "assistant" && obj.message && obj.message.model) {
      return obj.message.model;
    }
    if (
      obj.type === "attachment" &&
      obj.attachment &&
      obj.attachment.type === "model" &&
      obj.attachment.identity &&
      obj.attachment.identity.modelId
    ) {
      return obj.attachment.identity.modelId;
    }
  }
  return null;
}

function extractLatestResponse(transcriptPath) {
  const lines = readJsonLines(transcriptPath);
  let humanIdx = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (isHumanTextTurn(lines[i])) {
      humanIdx = i;
      break;
    }
  }
  if (humanIdx === -1) return { text: "", model: null, timestamp: null };

  const texts = [];
  let model = null;
  let timestamp = null;
  for (let i = humanIdx + 1; i < lines.length; i++) {
    const obj = lines[i];
    if (obj.type !== "assistant" || !obj.message) continue;
    if (obj.message.model) model = obj.message.model;
    if (obj.timestamp) timestamp = obj.timestamp;
    if (Array.isArray(obj.message.content)) {
      for (const block of obj.message.content) {
        if (block && block.type === "text" && block.text) {
          texts.push(block.text);
        }
      }
    }
  }
  return {
    text: texts.join("\n\n"),
    model,
    timestamp,
    promptText: humanTextOf(lines[humanIdx]),
  };
}

function loadState(statePath, sessionId) {
  try {
    const raw = fs.readFileSync(statePath, "utf8");
    return JSON.parse(raw);
  } catch (e) {
    return {
      session_id: sessionId,
      author: "abdullah-dev5",
      tool: "claude-code",
      project: null,
      model: null,
      logFile: null,
      entries: [],
    };
  }
}

function saveState(statePath, state) {
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2), "utf8");
}

function shortId(sessionId) {
  return (sessionId || "unknown").split("-")[0];
}

function renderMarkdown(state) {
  const promptEntries = state.entries.filter((e) => e.type === "PROMPT");
  const firstPromptTime = promptEntries.length
    ? promptEntries[0].timestamp
    : nowIso();
  const lastPromptTime = promptEntries.length
    ? promptEntries[promptEntries.length - 1].timestamp
    : firstPromptTime;
  const date = firstPromptTime.slice(0, 10);
  const sid = shortId(state.session_id);

  const frontmatter = [
    "---",
    `session_id: ${state.session_id}`,
    `date: ${date}`,
    `author: ${state.author}`,
    `model: ${state.model || "unknown"}`,
    `tool: ${state.tool}`,
    `project: ${state.project}`,
    `total_exchanges: ${promptEntries.length}`,
    `first_prompt_time: ${firstPromptTime}`,
    `last_prompt_time: ${lastPromptTime}`,
    "---",
    "",
  ].join("\n");

  const header = [
    `# Session Log - ${date}`,
    "",
    `Session: \`${sid}\` | Project: \`${state.project}\` | Author: \`${state.author}\``,
    "",
    "---",
    "",
    "",
  ].join("\n");

  const body = state.entries
    .map((e) => {
      return [
        `[LOG_ENTRY type=${e.type} num=${e.num} session=${sid}]`,
        `timestamp: ${e.timestamp}`,
        `model: ${e.model || "unknown"}`,
        "",
        e.text,
      ].join("\n");
    })
    .join("\n\n\n");

  return frontmatter + "\n" + header + body;
}

function writeLog(state, logsDir) {
  if (!state.logFile) {
    const first = state.entries[0];
    const ts = (first ? first.timestamp : nowIso())
      .replace(/[:.]/g, "-")
      .replace("T", "_")
      .replace("Z", "");
    // ts like 2026-09-10_09-14-02-118 -> trim milliseconds
    const trimmed = ts.replace(/-\d{3}$/, "");
    state.logFile = `${trimmed}_${state.session_id}.md`;
  }
  fs.mkdirSync(logsDir, { recursive: true });
  const fullPath = path.join(logsDir, state.logFile);
  fs.writeFileSync(fullPath, renderMarkdown(state), "utf8");
}

function nextPromptNum(state) {
  return state.entries.filter((e) => e.type === "PROMPT").length + 1;
}

function unmatchedPromptNum(state) {
  const prompts = state.entries.filter((e) => e.type === "PROMPT");
  const responses = state.entries.filter((e) => e.type === "RESPONSE");
  if (prompts.length > responses.length) {
    return prompts[prompts.length - 1].num;
  }
  return null;
}

function handleUserPromptSubmit(payload, state, projectDir, transcriptPath) {
  const promptText = typeof payload.prompt === "string" ? payload.prompt : "";
  const model =
    detectModelFromTranscript(transcriptPath) || state.model || "unknown";
  const timestamp = nowIso();
  state.model = model;
  state.project = state.project || path.basename(projectDir);

  state.entries.push({
    type: "PROMPT",
    num: nextPromptNum(state),
    timestamp,
    model,
    text: promptText,
  });
}

function handleStop(payload, state, projectDir, transcriptPath) {
  const extracted = extractLatestResponse(transcriptPath);
  state.project = state.project || path.basename(projectDir);

  // Self-heal: if the matching UserPromptSubmit entry never got logged
  // (hook missed/errored), reconstruct the PROMPT entry from the transcript
  // before logging the response, so nothing silently disappears.
  let num = unmatchedPromptNum(state);
  if (num === null && extracted.promptText) {
    num = nextPromptNum(state);
    state.entries.push({
      type: "PROMPT",
      num,
      timestamp: nowIso(),
      model: state.model || extracted.model || "unknown",
      text: extracted.promptText,
    });
  }
  if (num === null) return; // nothing to pair the response with

  const model = extracted.model || state.model || "unknown";
  const timestamp = extracted.timestamp || nowIso();
  state.model = model;

  state.entries.push({
    type: "RESPONSE",
    num,
    timestamp,
    model,
    text: extracted.text || "(no text response captured)",
  });
}

function main() {
  const raw = readStdin();
  let payload = {};
  try {
    payload = JSON.parse(raw);
  } catch (e) {
    payload = {};
  }

  const event = payload.hook_event_name || "";
  const sessionId = payload.session_id || "unknown-session";
  const projectDir = process.argv[2] || payload.cwd || process.cwd();
  const transcriptPath = payload.transcript_path;

  const logsDir = path.join(projectDir, ".agent-logs");
  const statePath = path.join(
    projectDir,
    ".claude",
    ".capture-state",
    `${sessionId}.json`
  );

  const state = loadState(statePath, sessionId);

  if (event === "UserPromptSubmit") {
    handleUserPromptSubmit(payload, state, projectDir, transcriptPath);
  } else if (event === "Stop") {
    handleStop(payload, state, projectDir, transcriptPath);
  } else {
    return;
  }

  writeLog(state, logsDir);
  saveState(statePath, state);
}

main();
