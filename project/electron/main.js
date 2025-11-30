const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let backendProcess;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        frame: false, // Custom frame if desired, or standard
        titleBarStyle: 'hiddenInset',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        },
        backgroundColor: '#0f0c29'
    });

    mainWindow.loadFile('renderer/index.html');
    mainWindow.webContents.openDevTools();
}

function startBackend() {
    const backendPath = path.join(__dirname, '..', 'backend', 'bin', 'Debug', 'net8.0', 'FileIndexer.exe');

    // Ensure backend exists or handle error
    console.log("Starting backend from:", backendPath);

    backendProcess = spawn(backendPath, [], {
        cwd: path.dirname(backendPath),
        stdio: ['pipe', 'pipe', 'pipe']
    });

    let buffer = '';
    backendProcess.stdout.on('data', (data) => {
        buffer += data.toString();

        let lineEndIndex;
        while ((lineEndIndex = buffer.indexOf('\n')) !== -1) {
            const line = buffer.substring(0, lineEndIndex);
            buffer = buffer.substring(lineEndIndex + 1);

            if (!line.trim()) continue;

            try {
                const json = JSON.parse(line);
                if (json.event !== 'progress') {
                    console.log("Parsed backend JSON:", json.event || "unknown");
                }
                if (mainWindow) {
                    mainWindow.webContents.send('backend-response', json);
                }
            } catch (e) {
                console.log('Backend non-JSON output:', line);
            }
        }
    });

    backendProcess.stderr.on('data', (data) => {
        const message = data.toString();
        // C# Console.Error writes here, but often it's just log info.
        // Only label as error if it explicitly says "Error" or "Exception"
        if (message.toLowerCase().includes('error') || message.toLowerCase().includes('exception')) {
            console.error('Backend Error:', message);
        } else {
            console.log('Backend Log:', message);
        }
    });

    backendProcess.on('close', (code) => {
        console.log(`Backend process exited with code ${code}`);
    });
}

app.whenReady().then(() => {
    createWindow();
    startBackend();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
    if (backendProcess) {
        backendProcess.stdin.write(JSON.stringify({ action: 'exit' }) + '\n');
        backendProcess.kill();
    }
});

const os = require('os');

ipcMain.on('send-command', (event, command) => {
    console.log('Main received command:', command);
    if (backendProcess) {
        backendProcess.stdin.write(JSON.stringify(command) + '\n');
    }
});

ipcMain.handle('get-home-dir', () => {
    return os.homedir();
});

ipcMain.on('window-minimize', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) win.minimize();
});

ipcMain.on('window-maximize', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) {
        if (win.isMaximized()) {
            win.unmaximize();
        } else {
            win.maximize();
        }
    }
});

ipcMain.on('window-close', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) win.close();
});
