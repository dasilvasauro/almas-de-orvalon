/* Almas de Orvalon — versão desktop (Linux/Windows/macOS) via Electron */
const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
function createWindow() {
  const win = new BrowserWindow({
    width: 1440, height: 900, minWidth: 960, minHeight: 640, backgroundColor: '#100a15', title: 'Almas de Orvalon',
    icon: path.join(__dirname, '..', 'resources', 'icon.png'), autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, sandbox: true, nodeIntegration: false }
  });
  Menu.setApplicationMenu(null);
  // o jogo é 100% local: bloqueia janelas novas e navegação para fora dos arquivos do app
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith('file://')) e.preventDefault(); });
  win.loadFile(path.join(__dirname, '..', 'www', 'index.html'));
  win.webContents.on('before-input-event', (e, input) => {
    if (input.type === 'keyDown' && input.key === 'F11') { win.setFullScreen(!win.isFullScreen()); e.preventDefault(); }
  });
}
app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
