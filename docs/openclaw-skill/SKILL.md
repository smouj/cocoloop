---
name: cocoloop-cl-studio
summary: Control the user's local CL Studio music project through its safe agent CLI.
---

# CL Studio integration for OpenClaw

CL Studio is a separate localhost music sequencer. If the user asks to create a beat, modify a drum rhythm, add bass notes or change a mix **inside CL Studio**, use the supplied command-line tool through OpenClaw's permitted `exec` capability. Do not edit project source files or use mouse-coordinate automation when structured actions are available.

**Prerequisites:** `python server.py` is running in the CL Studio folder, app is open at `http://127.0.0.1:38475`, and the user has enabled **Allow agent editing** in the inspector. Ask the user to turn on editing if actions are refused. The agent's `exec` needs access to the same computer / network namespace as the CL Studio bridge.

Set `<COCOLOOP_FOLDER>` to the absolute path chosen by the user. On Windows, prefer `py`; on Linux/macOS, use `python3`.

1. Read project state:
   ```
   python3 <COCOLOOP_FOLDER>/bridge/clctl.py project
   ```
2. Identify track IDs from returned JSON.
3. Plan changes, minimize mutation calls, submit a batch of <=64 actions, e.g.:
   ```
   python3 <COCOLOOP_FOLDER>/bridge/clctl.py batch '[{"type":"set_tempo","bpm":140},{"type":"set_steps","track_id":"ACTUAL_ID","steps":[0,4,8,12]}]'
   ```
4. Check the response: status must be `applied`, not merely `queued`; if rejected, explain the reason and do not claim success.
5. Re-read project to verify the intended change.

Useful action types: `set_tempo`, `set_title`, `add_track`, `set_steps`, `set_step`, `add_note`, `remove_note`, `set_track`, `set_clip`, `clear_track`. For `add_note`, `pitch` is MIDI 0–127; `start` is a sixteenth-note step 0–15; `length` is in 16th-note steps. Use `set_clip` to place patterns in bars 0..bars-1. Stable IDs can be specified in `add_track` and then used by subsequent actions in a single batch.

**Security:** local CL Studio is not a shell or file manager. Never request credentials or bypass its consent toggle. OpenClaw's own exec/file/network permissions remain separate and must be respected.
