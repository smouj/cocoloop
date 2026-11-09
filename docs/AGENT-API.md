# Agent API

CL Studio exposes a deliberately narrow, versioned action schema. Agents can read a project and submit musical edits. They cannot read arbitrary files, call URLs, execute commands or change application code through this API.

## Prerequisites

- `python3 server.py` is running on the same machine as the agent.
- The studio is open in a browser at <http://127.0.0.1:38475>.
- **Allow agent editing** is enabled in the Inspector. It is off by default and resets on reload.

## Authentication

Agent requests use a bearer token created on first server start:

```text
~/.cocoloop/agent-token        (mode 0600 where supported)
```

Read endpoints: `GET /api/state`, `GET /api/commands/<id>`.
Write endpoints: `POST /api/commands`, `POST /api/commands/<id>/result`.

The UI uses same-origin requests without the token. Do not share the token; delete it while the server is stopped to rotate it.

## Tools

### `cl_get_project`

Returns the current project object, including every track id, tempo, bars, steps, notes, clips and mixer values. Always call this before editing so IDs are real.

### `cl_apply_actions`

Takes `actions`: an ordered array of 1–64 action objects. All actions are validated against a candidate project. If any action fails, the whole batch is rejected and the project is unchanged.

## Action schema v1

| `type` | Fields | Constraints |
|---|---|---|
| `set_tempo` | `bpm` | integer 40–260 |
| `set_title` | `title` | non-empty string, max 120 |
| `set_bars` | `bars` | integer 1–32; clips beyond the new length are dropped |
| `set_master` | `volume` | 0–1 |
| `add_track` | `instrument`, `name?`, `id?` | known instrument, max 32 tracks; stable ID matches `^[a-zA-Z0-9_-]{1,64}$` |
| `delete_track` | `track_id` | must exist |
| `rename_track` | `track_id`, `name` | non-empty, max 90 |
| `set_step` | `track_id`, `step`, `enabled` | step 0–15, boolean |
| `set_steps` | `track_id`, `steps` | unique integers 0–15; replaces the pattern |
| `add_note` | `track_id`, `pitch`, `start`, `length?`, `velocity?` | synth tracks only; pitch 0–127, start 0–15, length 1–16, velocity 1–127 |
| `remove_note` | `track_id`, `pitch`, `start` | exact start |
| `set_track` | `track_id`, `field`, `value` | volume 0–1, pan −1–1, cutoff 200–18000, delay 0–1, mute/solo boolean |
| `set_clip` | `track_id`, `bar`, `enabled` | bar 0–bars−1 |
| `clear_track` | `track_id` | wipes steps and notes only |

Instruments: `kick`, `snare`, `hat`, `clap`, `perc`, `bass`, `keys`, `lead`, `pad`, `sampler`.

## Example session

```sh
# 1. Discover real track IDs
python3 bridge/clctl.py project

# 2. Submit a transaction
python3 bridge/clctl.py batch '[
  {"type":"set_tempo","bpm":124},
  {"type":"set_steps","track_id":"cl_kick_1","steps":[0,4,8,12]},
  {"type":"set_track","track_id":"cl_kick_1","field":"volume","value":0.9}
]'
```

Response:

```json
{"id": 12, "status": "applied", "message": "3 action(s) applied", "ok": true}
```

A rejected batch returns `ok: false` and a reason, and does not alter the project. The agent should read the project again after a rejection.

## MCP configuration

```json
{
  "mcpServers": {
    "cocoloop-cl-studio": {
      "command": "python3",
      "args": ["/ABSOLUTE/PATH/bridge/mcp_server.py"]
    }
  }
}
```

Codex CLI:

```sh
codex mcp add cocoloop-cl-studio -- python3 /ABSOLUTE/PATH/bridge/mcp_server.py
codex mcp list
```

On Windows use `py` and absolute paths with backslashes.

## Guidance for agents

1. Read first. Track IDs are generated and can change between projects.
2. Prefer one batch per musical idea; it becomes one undo step.
3. Use `set_steps` for drum patterns instead of 16 `set_step` calls.
4. Do not invent fields. Unknown action types are rejected.
5. Report the actual `applied` or `rejected` result to the user.
6. Ask the user to enable consent if you receive a consent error.

## Errors

| Status | Meaning |
|---|---|
| 401 | Missing or invalid bearer token |
| 403 | Bad Host header or cross-origin UI write |
| 400 | Invalid JSON, unknown action, or out-of-range value |
| 404 | Unknown command id or route |
| 409 | The UI is not open or has not checked in for 8 seconds |
| 202 | Command queued; poll `/api/commands/<id>` for the final status |
