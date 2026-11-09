# Roadmap

The priorities below are objectives, not claims of implemented functionality. Checked items have automated tests or a reproducible manual verification.

## v0.1 — Working alpha (released)

- [x] Branding, dark interface, timeline, track rack, Piano Roll, Mixer, Inspector.
- [x] Built-in instrument synthesis, step sequencing, bar arrangement, playback.
- [x] Offline WAV and MIDI export; JSON project save/load.
- [x] Import audio into Sampler tracks; portable project export with samples.
- [x] Undo/redo of human and agent actions.
- [x] Local authenticated action queue, agent consent, Codex MCP, OpenClaw CLI.
- [x] Model and Python HTTP API regression tests.

## v0.2 — Reliable music creation (current)

- [x] Master fader, metronome, note velocity and duplicate track.
- [x] Security headers, directory-listing disabled, host validation tests.
- [x] Browser smoke test in CI plus screenshot capture.
- [x] Full action-schema tests, WAV header tests and MIDI channel tests.
- [x] Professional repository: CI, release workflow, templates, security policy, docs.
- [ ] Fix and measure scheduling under CPU load, device changes and background tabs.
- [ ] Per-channel pattern variants, pattern switching, copy/paste, duplication and zoom.
- [ ] Note drag/resize, piano roll multi-selection and quantization.
- [ ] Independent audio clip arrangement, waveforms, time-stretch research.
- [ ] Autosave with binary sample storage (IndexedDB), recovery and backups.
- [ ] Mute/solo automation, mixer meters and insert FX chains.
- [ ] Instrument preset browser and additional original, redistributable sounds.
- [ ] Accessibility audit and Spanish/English localization.
- [ ] Full integration, snapshot and end-to-end tests plus security review.

## v0.3 — Desktop foundation

- [ ] Tauri 2 Windows/Linux/macOS shell with signed, reproducible builds where feasible.
- [ ] Native Rust (CPAL-based) or C++ audio engine in a realtime-safe thread.
- [ ] Stable serialized project format and migrations.
- [ ] Audio/MIDI device selection, latency calibration, keyboard and MIDI controllers.
- [ ] VST3/CLAP hosting research, respecting SDK and plugin licences.
- [ ] Native filesystem sandbox, atomic project saves, crash recovery.

## v0.4 — Agent-native workflows

- [ ] Bidirectional embedded OpenClaw Gateway client and Codex session UI.
- [ ] Embedded instruction chat, visible tool calls, diff previews, approval queue.
- [ ] Project snapshots, undo checkpoints, reversible agent transactions.
- [ ] Schema-checked high-level tools: compose 8 bars, create fills, mix stems.
- [ ] Safe scriptable audio workflows with explicit permissions.
- [ ] Full audit logging and human-readable action summaries.

## v1.0 — Public stable release criteria

- [ ] Cross-platform installers, tests and package SBOM.
- [ ] Robust low-latency audio and MIDI, track automation, multitrack audio recording.
- [ ] Stable VST/CLAP support or a documented compatible plugin subset.
- [ ] Recording and project resilience verified through stress tests.
- [ ] Full documentation, 100% redistributable media, accessibility review.
- [ ] Security audit, contributor guide, changelog and release process.
