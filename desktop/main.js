'use strict';

const { app, BrowserWindow, Menu, shell, dialog } = require('electron');
const { spawn, spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');
const net = require('net');

const APP_ID = 'com.smouj.cocoloop';
const DEFAULT_PORT = 38475;
const isDev = !app.isPackaged;

let mainWindow = null;
let serverProcess = null;
let serverPort = DEFAULT_PORT;

function logFile() {
  const dir = path.join(app.getPath('userData'), 'logs');
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, 'server.log');
}

function appendLog(line) {
  try {
    fs.appendFileSync(logFile(), '[' + new Date().toISOString() + '] ' + line + '\n');
  } catch {}
}

function resourcePath(...parts) {
  return path.join(process.resourcesPath, ...parts);
}

function appIcon() {
  return isDev
    ? path.join(__dirname, '..', 'app', 'assets', 'cocoloop.ico')
    : resourcePath('app', 'assets', 'cocoloop.ico');
}

function findPort(port) {
  return new Promise((resolve, reject) => {
    if (port > 65535) return reject(new Error('No hay puertos libres'));
    const server = net.createServer();
    server.once('error', () => resolve(findPort(port + 1)));
    server.once('listening', () => server.close(() => resolve(port)));
    server.listen(port, '127.0.0.1');
  });
}

function waitForHealth(port, timeout = 45000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const request = http.get({ host: '127.0.0.1', port, path: '/api/health', timeout: 1200 }, (response) => {
        response.resume();
        if (response.statusCode === 200) return resolve();
        retry();
      });
      request.on('error', retry);
      request.on('timeout', () => { request.destroy(); retry(); });
    };
    const retry = () => {
      if (Date.now() - started > timeout) return reject(new Error('El servidor local no respondió a tiempo'));
      setTimeout(attempt, 250);
    };
    attempt();
  });
}

function startServer(port) {
  const env = {
    ...process.env,
    COCOLOOP_APP_DIR: isDev ? path.join(__dirname, '..', 'app') : resourcePath('app'),
  };
  const command = isDev
    ? (process.platform === 'win32' ? 'python' : 'python3')
    : resourcePath('server', 'cocoloop-server.exe');
  const args = isDev
    ? [path.join(__dirname, '..', 'server.py'), '--port', String(port)]
    : ['--port', String(port)];

  appendLog('spawn ' + command + ' ' + args.join(' '));
  serverProcess = spawn(command, args, {
    cwd: isDev ? path.join(__dirname, '..') : resourcePath('app'),
    env,
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  serverProcess.stdout.on('data', (chunk) => appendLog('out ' + chunk.toString().trim()));
  serverProcess.stderr.on('data', (chunk) => appendLog('err ' + chunk.toString().trim()));
  serverProcess.on('exit', (code) => {
    appendLog('exit ' + code);
    serverProcess = null;
    if (!app.isQuitting && mainWindow) {
      dialog.showErrorBox('CocoLoop', 'El servidor local se detuvo inesperadamente. Revisa el registro en la carpeta de datos.');
      app.quit();
    }
  });
}

function stopServer() {
  if (!serverProcess) return;
  const pid = serverProcess.pid;
  try {
    if (process.platform === 'win32') {
      // PyInstaller one-file executables run a child process; kill the tree.
      spawnSync('taskkill', ['/pid', String(pid), '/T', '/F'], { windowsHide: true });
    } else {
      serverProcess.kill();
    }
  } catch (error) {
    appendLog('stop error ' + error.message);
  }
  serverProcess = null;
}

function buildMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        { label: 'Open data folder', click: () => shell.openPath(app.getPath('userData')) },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    { role: 'editMenu' },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'CocoLoop',
      submenu: [
        {
          label: 'Open library folder',
          click: () => shell.openPath(isDev ? path.join(__dirname, '..', 'app', 'library') : resourcePath('app', 'library')),
        },
        { label: 'Documentation', click: () => shell.openExternal('https://github.com/smouj/cocoloop#readme') },
        { label: 'Report an issue', click: () => shell.openExternal('https://github.com/smouj/cocoloop/issues') },
        { type: 'separator' },
        {
          label: 'About CocoLoop',
          click: () => dialog.showMessageBox({
            type: 'info',
            title: 'CocoLoop',
            message: 'CocoLoop · CL Studio',
            detail: 'Version ' + app.getVersion() + '\nLocal-first, open-source DAW with agent-native editing.\nMIT licensed.',
          }),
        },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

async function createWindow() {
  serverPort = await findPort(DEFAULT_PORT);
  startServer(serverPort);
  mainWindow = new BrowserWindow({
    width: 1500,
    height: 960,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: '#0b1019',
    show: false,
    title: 'CocoLoop · CL Studio',
    icon: appIcon(),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.on('closed', () => { mainWindow = null; });
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  try {
    await waitForHealth(serverPort);
    await mainWindow.loadURL('http://127.0.0.1:' + serverPort);
  } catch (error) {
    appendLog('startup error ' + error.message);
    dialog.showErrorBox('CocoLoop', 'No se pudo iniciar el estudio local.\n\n' + error.message);
    app.quit();
  }
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.setAppUserModelId(APP_ID);
  app.on('second-instance', () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  });
  app.whenReady().then(() => {
    buildMenu();
    createWindow();
  });
  app.on('before-quit', () => {
    app.isQuitting = true;
    stopServer();
  });
  app.on('window-all-closed', () => app.quit());
}
