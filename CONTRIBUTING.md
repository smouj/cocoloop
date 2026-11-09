# Contributing to CocoLoop · CL Studio

Thanks for helping. CocoLoop is MIT-licensed and deliberately small: a browser DAW, a Python standard-library bridge, and a narrow agent API.

## Before you start

1. Read `README.md`, `docs/ARCHITECTURE.md`, `docs/AGENT-API.md` and `docs/ROADMAP.md`.
2. Search open issues and pull requests; open an issue for anything larger than a typo before writing code.
3. Keep the core free, local and runnable with Python 3.10+ and a browser. Do not add required accounts, cloud services or paid assets.

## Development setup

```sh
git clone https://github.com/smouj/cocoloop.git
cd cocoloop
python3 server.py --open          # http://127.0.0.1:38475
```

Optional developer tools:

```sh
python3 -m pip install -r requirements-dev.txt
python3 -m playwright install chromium
node tests/model_test.mjs
python3 -m unittest discover -s tests -p 'test_*.py' -v
```

Node 22+ is only used to run the optional model tests; the app itself does not need Node.

## Rules of the project

- **No silent schema changes.** The project format is versioned; add migrations instead of mutating old files.
- **Agent safety is non-negotiable.** Every mutation must stay allowlisted, bounded, visible, consent-controlled and reversible. Never add shell, network or arbitrary path actions to the bridge.
- **No proprietary assets.** Do not copy presets, samples, names or trade dress from commercial DAWs.
- **Facts over marketing.** If a feature is not implemented and tested, it belongs in the roadmap, not in the feature list.
- **Original audio.** New instruments must be synthesized or made from redistributable samples with a recorded licence.

## Pull requests

- One focused change per pull request.
- Include tests for behaviour changes; include a listening note for audio changes.
- Run `npm test` and, when the UI changes, `python3 tests/browser_smoke.py`.
- Update `CHANGELOG.md` for user-visible changes.
- Screenshots are welcome for UI changes. Capture at 1600×1000 and keep them under 300 KB if possible.

## Commit style

Prefer short, imperative subjects, for example:

```text
fix(bridge): reject stale host headers
feat(ui): add master fader
docs: clarify consent reset behaviour
```

## Releases

Maintainers tag `vMAJOR.MINOR.PATCH`. The release workflow runs the test suite, builds the ZIP and publishes a checksum. Update `package.json`, `CHANGELOG.md`, `server.py` and `bridge/mcp_server.py` together.

## Code of conduct

Participation is covered by [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). Report security issues privately via [SECURITY.md](SECURITY.md).
