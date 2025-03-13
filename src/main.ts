import { app, BrowserWindow, dialog, Menu, shell } from 'electron';
import * as path from 'path';
import { registerFileSystemHandlers } from '@infrastructure/electron/FileSystemHandlers';

// Type definitions
interface AppConfig {
    width: number;
    height: number;
    minWidth: number;
    minHeight: number;
    backgroundColor: string;
    devTools: boolean;
}

// App configuration
const config: AppConfig = {
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#121212',
    devTools: process.env.NODE_ENV === 'development',
};

// Keep a global reference of the window object to avoid garbage collection
let mainWindow: BrowserWindow | null = null;

// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (require('electron-squirrel-startup')) {
    app.quit();
}

/**
 * Creates the main application window
 */
function createWindow(): void {
    // Create the browser window
    mainWindow = new BrowserWindow({
        width: config.width,
        height: config.height,
        minWidth: config.minWidth,
        minHeight: config.minHeight,
        backgroundColor: config.backgroundColor,
        show: false, // Don't show until loaded
        titleBarStyle: 'hiddenInset', // macOS specific
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
        },
    });

    // Load the index.html from the dist directory
    const indexPath = path.join(__dirname, 'index.html');
    mainWindow.loadFile(indexPath);

    // Open dev tools if in development
    if (config.devTools) {
        mainWindow.webContents.openDevTools();
    }

    // Show window when ready to avoid flashing blank content
    mainWindow.on('ready-to-show', () => {
        mainWindow?.show();
    });

    // Handle window being closed
    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Set up custom application menu
    setupApplicationMenu();
}

/**
 * Sets up the application menu
 */
function setupApplicationMenu(): void {
    const isMac = process.platform === 'darwin';

    const template: Electron.MenuItemConstructorOptions[] = [
        // App menu (macOS only)
        ...(isMac
            ? [
                  {
                      label: app.name,
                      submenu: [
                          { role: 'about' as const },
                          { type: 'separator' as const },
                          { role: 'services' as const },
                          { type: 'separator' as const },
                          { role: 'hide' as const },
                          { role: 'hideOthers' as const },
                          { role: 'unhide' as const },
                          { type: 'separator' as const },
                          { role: 'quit' as const },
                      ],
                  },
              ]
            : []),

        // File menu
        {
            label: 'File',
            submenu: [
                {
                    label: 'Import Music',
                    accelerator: 'CmdOrCtrl+O',
                    click: async () => {
                        await showImportDialog();
                    },
                },
                { type: 'separator' as const },
                isMac ? { role: 'close' as const } : { role: 'quit' as const },
            ],
        },

        // Edit menu
        {
            label: 'Edit',
            submenu: [
                { role: 'undo' as const },
                { role: 'redo' as const },
                { type: 'separator' as const },
                { role: 'cut' as const },
                { role: 'copy' as const },
                { role: 'paste' as const },
                ...(isMac
                    ? [
                          { role: 'pasteAndMatchStyle' as const },
                          { role: 'delete' as const },
                          { role: 'selectAll' as const },
                          { type: 'separator' as const },
                          {
                              label: 'Speech',
                              submenu: [
                                  { role: 'startSpeaking' as const },
                                  { role: 'stopSpeaking' as const },
                              ],
                          },
                      ]
                    : [
                          { role: 'delete' as const },
                          { type: 'separator' as const },
                          { role: 'selectAll' as const },
                      ]),
            ],
        },

        // View menu
        {
            label: 'View',
            submenu: [
                { role: 'reload' as const },
                { role: 'forceReload' as const },
                ...(config.devTools
                    ? [{ role: 'toggleDevTools' as const }]
                    : []),
                { type: 'separator' as const },
                { role: 'resetZoom' as const },
                { role: 'zoomIn' as const },
                { role: 'zoomOut' as const },
                { type: 'separator' as const },
                { role: 'togglefullscreen' as const },
            ],
        },

        // Window menu
        {
            label: 'Window',
            submenu: [
                { role: 'minimize' as const },
                { role: 'zoom' as const },
                ...(isMac
                    ? [
                          { type: 'separator' as const },
                          { role: 'front' as const },
                          { type: 'separator' as const },
                          { role: 'window' as const },
                      ]
                    : [{ role: 'close' as const }]),
            ],
        },

        // Help menu
        {
            role: 'help' as const,
            submenu: [
                {
                    label: 'Learn More',
                    click: async () => {
                        await shell.openExternal(
                            'https://github.com/yourusername/cadence'
                        );
                    },
                },
                {
                    label: 'Keyboard Shortcuts',
                    accelerator: 'CmdOrCtrl+/',
                    click: () => {
                        mainWindow?.webContents.send('show-keyboard-shortcuts');
                    },
                },
            ],
        },
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

/**
 * Shows the import dialog for selecting music directories
 */
async function showImportDialog(): Promise<void> {
    if (!mainWindow) return;

    try {
        const result = await dialog.showOpenDialog(mainWindow, {
            title: 'Import Music',
            defaultPath: app.getPath('music'),
            properties: ['openDirectory' as const, 'multiSelections' as const],
        });

        if (!result.canceled && result.filePaths.length > 0) {
            mainWindow.webContents.send('import-directories', result.filePaths);
        }
    } catch (error) {
        console.error('Error showing import dialog:', error);
    }
}

/**
 * App lifecycle: When app is ready to create windows
 */
app.whenReady().then(() => {
    // Create the main application window
    createWindow();

    // Register IPC handlers for file system operations
    registerFileSystemHandlers();

    // On macOS, recreate window when dock icon is clicked
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

/**
 * App lifecycle: Quit when all windows are closed, except on macOS
 */
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

/**
 * App lifecycle: Handle 'second-instance' event for Windows
 */
app.on('second-instance', () => {
    // Focus the main window if a second instance is launched
    if (mainWindow) {
        if (mainWindow.isMinimized()) {
            mainWindow.restore();
        }
        mainWindow.focus();
    }
});

/**
 * App lifecycle: Handle uncaught exceptions
 */
process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);

    // Show a user-friendly error dialog
    if (mainWindow) {
        dialog.showErrorBox(
            'An error occurred',
            `Cadence encountered an unexpected error.\n\n${error.message}`
        );
    }
});

// Export functionalities for testing
export { createWindow, showImportDialog };
