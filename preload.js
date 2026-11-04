const { contextBridge, ipcRenderer } = require('electron');
const inv = c => (...a) => ipcRenderer.invoke(c, ...a);
contextBridge.exposeInMainWorld('api', {
  version: inv('version'),
  open: inv('open'),
  save: inv('save'),
  saveMany: inv('save-many'),
  updateCheck: inv('update-check'),
  updateDownload: inv('update-download'),
  updateInstall: inv('update-install'),
  onUpdate: cb => ipcRenderer.on('update-status', (_e, s) => cb(s))
});
