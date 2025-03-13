import { contextBridge, ipcRenderer } from 'electron';
import {
    DirectoryPickerOptions,
    FileStats,
} from './core/interfaces/FileSystemService';

/**
 * Safely expose limited APIs to the renderer process.
 * This creates a controlled bridge between the main and renderer processes.
 */
contextBridge.exposeInMainWorld('electron', {
    // File system operations
    fs: {
        readDirectory: (path: string): Promise<string[]> =>
            ipcRenderer.invoke('fs:read-directory', path),

        readFile: (path: string): Promise<ArrayBuffer> =>
            ipcRenderer.invoke('fs:read-file', path),

        getStats: (path: string): Promise<FileStats> =>
            ipcRenderer.invoke('fs:get-stats', path),

        exists: (path: string): Promise<boolean> =>
            ipcRenderer.invoke('fs:exists', path),

        getMusicDirectory: (): Promise<string> =>
            ipcRenderer.invoke('fs:get-music-directory'),

        showDirectoryPicker: (
            options?: DirectoryPickerOptions
        ): Promise<string[]> =>
            ipcRenderer.invoke('fs:show-directory-picker', options),

        resolvePath: (relativePath: string): Promise<string> =>
            ipcRenderer.invoke('fs:resolve-path', relativePath),

        scanDirectoryForMusic: (
            dirPath: string,
            fileExtensions: string[]
        ): Promise<string[]> =>
            ipcRenderer.invoke(
                'fs:scan-directory-for-music',
                dirPath,
                fileExtensions
            ),
    },

    // Application events
    app: {
        /**
         * Listen for events from the main process
         * @param channel Event channel name
         * @param callback Function to call when event is received
         */
        on: (channel: string, callback: (...args: any[]) => void): void => {
            // Whitelist channels for security
            const validChannels = [
                'import-directories',
                'show-keyboard-shortcuts',
                'playback-shortcut',
            ];

            if (validChannels.includes(channel)) {
                // Remove any existing listeners to avoid memory leaks
                ipcRenderer.removeAllListeners(channel);

                // Add the new listener
                ipcRenderer.on(channel, (_event, ...args) => callback(...args));
            }
        },

        /**
         * Remove listener for an event
         * @param channel Event channel name
         */
        removeAllListeners: (channel: string): void => {
            const validChannels = [
                'import-directories',
                'show-keyboard-shortcuts',
                'playback-shortcut',
            ];

            if (validChannels.includes(channel)) {
                ipcRenderer.removeAllListeners(channel);
            }
        },
    },
});

// Preload can also set up other initialization that needs to happen
// before the renderer process loads

// Let the main process know the preload script has finished
ipcRenderer.send('preload-ready');
