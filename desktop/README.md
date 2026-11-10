# CocoLoop desktop shell

Electron wrapper that starts the bundled local server, opens CL Studio in a native window and installs a desktop shortcut.

## Development

```sh
cd desktop
npm install
npm start
```

In development the shell uses `python3 server.py` from the repository root. In a packaged build it starts `resources/server/cocoloop-server.exe`, produced with PyInstaller.

## Build the Windows installer

Prerequisites on Windows: Node 22+, Python 3.10+ and npm.

```powershell
cd desktop
npm install
py -m pip install pyinstaller
py -m PyInstaller --noconfirm --onefile --name cocoloop-server --icon ..\app\assets\cocoloop.ico --distpath resources\server --workpath .build\server --specpath .build ..\server.py
py -m PyInstaller --noconfirm --onefile --name cocoloop-mcp --paths ..\bridge --distpath resources\server --workpath .build\mcp --specpath .build ..\bridge\mcp_server.py
py -m PyInstaller --noconfirm --onefile --name cocoloop-cli --paths ..\bridge --distpath resources\server --workpath .build\cli --specpath .build ..\bridge\clctl.py
npm run dist
```

The installer is written to `desktop/dist/CocoLoop-Setup-0.3.0.exe`. It installs per user, creates a desktop shortcut and starts the app.

## Runtime layout

```text
CocoLoop/
  CocoLoop.exe
  resources/
    app/                 static UI + bundled library/profile
    server/
      cocoloop-server.exe  HTTP + static server
      cocoloop-mcp.exe     MCP stdio adapter for Codex
      cocoloop-cli.exe     CLI adapter for OpenClaw
```

The server only listens on `127.0.0.1`. The token remains at `%USERPROFILE%\.cocoloop\agent-token` so CLI and MCP adapters share it with the app.
