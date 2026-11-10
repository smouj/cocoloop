# Development

## Requirements

- Python 3.10+ (3.12 recommended)
- A modern Chromium, Firefox or Edge browser
- Node 22+ only for the optional model tests
- Playwright + Chromium only for the browser test and screenshots

## Run

```sh
python3 server.py --open
# http://127.0.0.1:38475
```

The server writes a token to `~/.cocoloop/agent-token` on first start. The UI must be open for agent commands to apply.

## Tests

```sh
node tests/model_test.mjs
python3 -m unittest discover -s tests -p 'test_*.py' -v
```

Browser test (needs a live server):

```sh
python3 -m pip install -r requirements-dev.txt
python3 -m playwright install chromium
python3 server.py &
python3 tests/browser_smoke.py
```

The browser test also refreshes the four screenshots in `docs/screenshots/`.

## Code map

| File | Responsibility |
|---|---|
| `app/model.js` | project schema, validation, actions, helpers |
| `app/audio.js` | synth graph, scheduler, WAV and MIDI encoders |
| `app/main.js` | rendering, events, bridge polling |
| `app/index.html` | static shell |
| `app/styles.css` | visual system |
| `server.py` | static server, API, auth, security headers |
| `bridge/client.py` | authenticated HTTP client |
| `bridge/mcp_server.py` | MCP stdio adapter |
| `bridge/clctl.py` | CLI adapter |

## Adding an action

1. Add the case to `applyAction` in `app/model.js`; deep-copy first, validate every field, return the candidate.
2. Add the type to `ALLOWED_ACTIONS` in `server.py`.
3. Update the MCP tool description and `docs/AGENT-API.md`.
4. Add a positive and a negative test in `tests/model_test.mjs`.
5. If the UI can trigger it, add a control and a browser smoke assertion.

## Screenshots

The browser test writes:

- `docs/screenshots/studio.png`
- `docs/screenshots/piano-roll.png`
- `docs/screenshots/mixer.png`
- `docs/screenshots/agents.png`

Use a 1600×1000 viewport and keep the UI free of toasts while capturing.

## Release checklist

- [ ] Update `package.json`, `server.py`, `bridge/mcp_server.py`, `index.html` and `CHANGELOG.md`.
- [ ] Run model, Python and browser tests.
- [ ] Confirm no secrets, samples or personal projects are staged.
- [ ] Tag `vX.Y.Z` and push; the release workflow publishes the ZIP and `SHA256SUMS.txt`.
- [ ] Update the GitHub release notes and roadmap checkboxes.

## Desktop build

The desktop shell lives in `desktop/` and uses Electron. In development:

```sh
cd desktop
npm install
npm start
```

The packaged app starts a PyInstaller build of `server.py` and loads the bundled `app/` directory. Build the sidecars and installer on Windows:

```powershell
cd desktop
npm install
py -m pip install --user pyinstaller
py -m PyInstaller --noconfirm --onefile --name cocoloop-server --icon ..\app\assets\cocoloop.ico --distpath resources\server --workpath .build\server --specpath .build ..\server.py
py -m PyInstaller --noconfirm --onefile --name cocoloop-mcp --paths ..\bridge --distpath resources\server --workpath .build\mcp --specpath .build ..\bridge\mcp_server.py
py -m PyInstaller --noconfirm --onefile --name cocoloop-cli --paths ..\bridge --distpath resources\server --workpath .build\cli --specpath .build ..\bridge\clctl.py
npm run dist
```

The installer is `desktop/dist/CocoLoop-Setup-<version>.exe`. The default library is `app/library/profile.json`; add items there and they appear in the Library view without rebuilding the shell.

The server reads `COCOLOOP_APP_DIR` (static UI root) and `COCOLOOP_HOME` (token directory). Electron sets the former to `resources/app` and leaves the token at `%USERPROFILE%\.cocoloop\agent-token` so MCP and CLI share it.
