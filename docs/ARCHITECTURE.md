# Architecture

## Goals

1. Run with no runtime dependencies beyond Python's standard library and a browser.
2. Let humans and agents edit the same project through one validated model.
3. Keep every mutation visible and reversible.
4. Make the audio engine replaceable without rewriting the project model.

## Components

```text
┌─────────────────────────────────────────────────────────────┐
│ Browser (http://127.0.0.1:38475)                            │
│  app/index.html  app/styles.css                             │
│  app/main.js    UI state, rendering, bridge polling         │
│  app/model.js   schema, validation, atomic actions          │
│  app/audio.js   Web Audio scheduler, WAV, MIDI              │
└───────────────┬─────────────────────────────────────────────┘
                │ same-origin JSON (state + command queue)
┌───────────────▼─────────────────────────────────────────────┐
│ server.py — ThreadingHTTPServer on 127.0.0.1                │
│  static files + /api/health + /api/state + /api/commands    │
│  bearer token for agents, Host/Origin checks, CSP           │
└───────────────┬─────────────────────────────────────────────┘
                │ MCP stdio / CLI
┌───────────────▼─────────────────────────────────────────────┐
│ bridge/clctl.py · bridge/mcp_server.py · bridge/client.py   │
└─────────────────────────────────────────────────────────────┘
```

## Invariants

- `applyAction` never mutates its input; it deep-copies the project and returns a candidate.
- `applyActions` validates a whole batch against the candidate; a failure leaves the original untouched.
- The UI commits a candidate only after validation; the previous project object is pushed to undo.
- Agent commands are queued by the server, applied by the open UI, and acknowledged with `applied` or `rejected`.
- The server never executes project content; it only stores JSON and serves allowlisted actions.
- The token is read-only to the UI; it is only required for agent writes and state reads.

## Audio path

- `AudioEngine.play` builds a graph: input → low-pass → pan → volume → master → compressor → analyser → destination.
- A lookahead timer schedules 16th-note steps 150 ms ahead using `AudioContext.currentTime`.
- Per-track delay is a feedback loop off the filter, wet signal panned into the mix.
- `renderWav` uses `OfflineAudioContext` with the same scheduler and a dedicated WAV encoder. The metronome is disabled for offline renders.
- `midiBlob` writes a format-0 MIDI file: tempo track, one track per project track, drums on channel 10 and melodic channels skipping channel 10.

## Security boundaries

| Boundary | Control |
|---|---|
| Network | bind 127.0.0.1, Host validation, no directory listing |
| Browser → server writes | same-origin check |
| Agent → server writes | bearer token, allowlist, 1–64 actions, 2 MB limit |
| Agent → UI | consent toggle, activity log, undo, acknowledgement |
| Rendered page | restrictive CSP, nosniff, DENY framing, no-referrer |

## Extension points

- **New instrument:** add an entry to `INSTRUMENTS` and a voice in `soundSynth`/`soundDrum`.
- **New action:** add it to the model switch, `ALLOWED_ACTIONS` in `server.py`, the MCP description, `docs/AGENT-API.md` and tests.
- **New export:** keep it offline and deterministic; add a golden test for the header and a listening note.
- **Desktop shell:** wrap the static UI in Tauri and keep `server.py` as the development bridge until a Rust audio engine lands.

## Test strategy

| Layer | Tool | What it proves |
|---|---|---|
| Model | Node test runner | schema limits, atomicity, every action, WAV/MIDI output |
| HTTP bridge | `unittest` | auth, origin, host, headers, command lifecycle |
| MCP | `unittest` subprocess | initialize, tools/list, tool contract |
| Browser | Playwright | rendering, clicks, undo/redo, views, screenshots |

No test claims to prove audio quality; listening tests remain manual.
