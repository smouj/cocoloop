# Changelog

All notable changes are documented here. The project is an alpha; APIs may change with a migration note.

## 0.3.0 — 2026-11-10

### Added

- **Desktop application**: Electron shell for Windows with a native window, application menu, single-instance lock and automatic local server management.
- **Installer**: per-user NSIS installer, desktop shortcut and Start menu entry, built with electron-builder.
- **Bundled runtime**: PyInstaller builds of the HTTP server, MCP stdio adapter and CLI adapter, so the installed app does not require Python.
- **Default profile**: `CocoLoop Default Studio` with 21 ready items: 3 project templates, 7 patterns, 4 mixer presets, 5 built-in plugins and 2 agent profiles.
- **Library view**: browse templates, patterns, presets, plugins and agent profiles; apply or copy them in one click.
- **Built-in plugins**: Four on the Floor, Humanize Hats, Chord Stack, Balance Mix and Lo-fi Dust, resolved by track role and committed as one undo step.
- **Desktop documentation** and a Windows build workflow.

### Changed

- Server accepts `COCOLOOP_APP_DIR` for packaged resources and `COCOLOOP_HOME` for the token location.
- Version strings, README, Spanish README, roadmap, specification and landing page updated for 0.3.0.

### Verified

- Browser suite covers the Library view, item count and a plugin application.
- Packaged `CocoLoop.exe` starts the bundled server and serves the UI on loopback.

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
