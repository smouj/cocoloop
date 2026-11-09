# Changelog

All notable changes are documented here. The project is an alpha; APIs may change with a migration note.

## 0.2.0 — 2026-11-09

### Added

- Master fader in the mixer, backed by the existing `set_master` action.
- Metronome with bar accent, available during playback and excluded from WAV renders.
- Note velocity selector in the Piano Roll; new notes inherit the selected velocity.
- Duplicate-track action in the Inspector, preserving pattern, notes, clips, mixer values and sampler data.
- Real browser smoke test with Playwright; it also refreshes the documentation screenshots.
- Full test coverage for every documented agent action, WAV headers and MIDI channel routing.
- CI for Node 22/24, Python 3.10–3.13 and a headless Chromium job.
- Release workflow, issue templates, Code of Conduct, security policy, citation metadata and architecture/agent API docs.

### Changed

- Security headers are now applied to static files as well as API responses: restrictive CSP, `nosniff`, `DENY` framing, no-referrer and permissions policy.
- Directory listing is disabled.
- MIDI export allocates melodic channels without colliding with the General MIDI drum channel.
- WAV encoding is a standalone, unit-tested function.
- README, Spanish README, contributing guide and roadmap rewritten around verified behaviour.
- Version strings updated to 0.2.0 across UI, server and MCP server.

### Fixed

- MIDI channel collisions could route melodic notes to channel 10.
- The browser test no longer depends on a hard-coded Chromium path or `/mnt/data` output directory.

## 0.1.1 — 2026-11-09

- Product renamed to **CocoLoop (CL Studio)**.
- Integrated the two transparent logos, icon sizes, favicon and an editable simplified SVG.
- Updated UI, identity, documentation, MCP bridge, commands and examples.
- Migrated old `alstudio.project` projects to `clstudio.project` on import.
- The audio engine and feature level remain alpha; branding changes are not musical features.

## 0.1.0 — 2026-11-09

Initial alpha prototype:

- Original UI and brand.
- Web Audio synth/drum sequencer, MIDI Piano Roll, arrangement and mixer.
- MIDI and offline WAV export.
- JSON project format and sample import.
- Local MCP server, OpenClaw CLI, consent and action validation.
- Automated project-model, MCP handshake and local API tests.

Unverified in that release: full browser playback tests, audio output on real Windows devices, cross-browser render parity, Windows native packaging and professional mixing quality.
