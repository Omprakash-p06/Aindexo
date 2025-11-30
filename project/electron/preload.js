const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    sendCommand: (command) => ipcRenderer.send('send-command', command),
    onResponse: (callback) => ipcRenderer.on('backend-response', (event, data) => callback(data)),
    removeResponseListener: () => ipcRenderer.removeAllListeners('backend-response'),
    getHomeDir: () => ipcRenderer.invoke('get-home-dir')
});
