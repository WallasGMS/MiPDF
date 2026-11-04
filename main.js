const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const fs = require('fs');
const path = require('path');

let win;
const send = s => win && !win.isDestroyed() && win.webContents.send('update-status', s);
const pdfFilter = [{ name: 'PDF', extensions: ['pdf'] }];

function createWindow() {
  win = new BrowserWindow({
    width: 1320, height: 840, minWidth: 900, minHeight: 600,
    title: 'Mi PDF', icon: path.join(__dirname, 'icon.png'), autoHideMenuBar: true,
    backgroundColor: '#E4E7EC',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false }
  });
  win.loadFile('index.html');
}

if (!app.requestSingleInstanceLock()) app.quit();
app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());

ipcMain.handle('version', () => app.getVersion());

ipcMain.handle('open', async () => {
  const r = await dialog.showOpenDialog(win, { properties: ['openFile'], filters: pdfFilter });
  if (r.canceled) return null;
  const p = r.filePaths[0];
  return { name: path.basename(p), data: new Uint8Array(fs.readFileSync(p)) };
});

ipcMain.handle('save', async (_e, data, name) => {
  const r = await dialog.showSaveDialog(win, { defaultPath: name, filters: pdfFilter });
  if (r.canceled) return null;
  fs.writeFileSync(r.filePath, Buffer.from(data));
  return path.basename(r.filePath);
});

ipcMain.handle('save-many', async (_e, files) => {
  const r = await dialog.showOpenDialog(win, { properties: ['openDirectory', 'createDirectory'], title: 'Elige la carpeta donde guardar' });
  if (r.canceled) return 0;
  for (const f of files) fs.writeFileSync(path.join(r.filePaths[0], f.name), Buffer.from(f.data));
  return files.length;
});

// --- actualizaciones (GitHub Releases) ---
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = false;
autoUpdater.on('checking-for-update', () => send({ state: 'checking' }));
autoUpdater.on('update-available', i => send({ state: 'available', version: i.version }));
autoUpdater.on('update-not-available', () => send({ state: 'none' }));
autoUpdater.on('download-progress', p => send({ state: 'downloading', percent: Math.round(p.percent) }));
autoUpdater.on('update-downloaded', i => send({ state: 'ready', version: i.version }));
autoUpdater.on('error', e => send({ state: 'error', msg: /404|latest\.yml|No published/i.test(String(e)) ? 'Aún no hay versiones publicadas.' : 'No se pudo buscar actualizaciones.' }));

ipcMain.handle('update-check', (_e, repo) => {
  if (!app.isPackaged) return send({ state: 'error', msg: 'Solo funciona en la app instalada.' });
  const [owner, name] = String(repo || '').split('/');
  if (owner && name) autoUpdater.setFeedURL({ provider: 'github', owner, repo: name });
  autoUpdater.checkForUpdates().catch(() => {});
});
ipcMain.handle('update-download', () => autoUpdater.downloadUpdate().catch(() => {}));
ipcMain.handle('update-install', () => autoUpdater.quitAndInstall());
