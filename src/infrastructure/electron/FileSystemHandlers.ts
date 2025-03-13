import { app, ipcMain, dialog } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';

// Convert fs methods to promises
const readdir = util.promisify(fs.readdir);
const stat = util.promisify(fs.stat);
const readFile = util.promisify(fs.readFile);
const exists = util.promisify(fs.exists);

/**
 * Registers all IPC handlers for file system operations.
 * Called from main.ts during app initialization.
 */
export function registerFileSystemHandlers(): void {
    ipcMain.handle('fs:read-directory', handleReadDirectory);
    ipcMain.handle('fs:read-file', handleReadFile);
    ipcMain.handle('fs:get-stats', handleGetStats);
    ipcMain.handle('fs:exists', handleExists);
    ipcMain.handle('fs:get-music-directory', handleGetMusicDirectory);
    ipcMain.handle('fs:show-directory-picker', handleShowDirectoryPicker);
    ipcMain.handle('fs:resolve-path', handleResolvePath);
    ipcMain.handle('fs:scan-directory-for-music', handleScanDirectoryForMusic);
}

/**
 * Handles reading a directory's contents
 */
async function handleReadDirectory(
    _: Electron.IpcMainInvokeEvent,
    dirPath: string
): Promise<string[]> {
    try {
        return await readdir(dirPath);
    } catch (error) {
        console.error('Error reading directory:', error);
        throw error;
    }
}

/**
 * Handles reading a file's contents
 */
async function handleReadFile(
    _: Electron.IpcMainInvokeEvent,
    filePath: string
): Promise<Buffer> {
    try {
        return await readFile(filePath);
    } catch (error) {
        console.error('Error reading file:', error);
        throw error;
    }
}

/**
 * Handles getting stats for a file or directory
 */
async function handleGetStats(
    _: Electron.IpcMainInvokeEvent,
    filePath: string
): Promise<{
    size: number;
    isFile: boolean;
    isDirectory: boolean;
    createdAt: Date;
    modifiedAt: Date;
    accessedAt: Date;
}> {
    try {
        const stats = await stat(filePath);
        return {
            size: stats.size,
            isFile: stats.isFile(),
            isDirectory: stats.isDirectory(),
            createdAt: stats.birthtime,
            modifiedAt: stats.mtime,
            accessedAt: stats.atime,
        };
    } catch (error) {
        console.error('Error getting file stats:', error);
        throw error;
    }
}

/**
 * Handles checking if a path exists
 */
async function handleExists(
    _: Electron.IpcMainInvokeEvent,
    filePath: string
): Promise<boolean> {
    try {
        return await exists(filePath);
    } catch (error) {
        console.error('Error checking if file exists:', error);
        throw error;
    }
}

/**
 * Handles getting the user's music directory
 */
function handleGetMusicDirectory(): string {
    return app.getPath('music');
}

/**
 * Handles showing a directory picker dialog
 */
async function handleShowDirectoryPicker(
    _: Electron.IpcMainInvokeEvent,
    options?: {
        title?: string;
        defaultPath?: string;
        multiSelections?: boolean;
    }
): Promise<string[]> {
    const { title, defaultPath, multiSelections } = options || {};

    try {
        const properties: Array<'openDirectory' | 'multiSelections'> = [
            'openDirectory',
        ];

        if (multiSelections) {
            properties.push('multiSelections');
        }

        const result = await dialog.showOpenDialog({
            title: title || 'Select Directory',
            defaultPath: defaultPath || app.getPath('music'),
            properties,
        });

        return result.canceled ? [] : result.filePaths;
    } catch (error) {
        console.error('Error showing directory picker:', error);
        throw error;
    }
}

/**
 * Handles resolving a path relative to the application
 */
function handleResolvePath(
    _: Electron.IpcMainInvokeEvent,
    relativePath: string
): string {
    return path.resolve(app.getAppPath(), relativePath);
}

/**
 * Handles scanning a directory recursively for music files
 */
async function handleScanDirectoryForMusic(
    _: Electron.IpcMainInvokeEvent,
    dirPath: string,
    fileExtensions: string[]
): Promise<string[]> {
    try {
        return await scanDirectoryForMusic(dirPath, fileExtensions);
    } catch (error) {
        console.error('Error scanning directory for music:', error);
        throw error;
    }
}

/**
 * Recursively scans a directory for music files with specified extensions
 */
async function scanDirectoryForMusic(
    dirPath: string,
    fileExtensions: string[]
): Promise<string[]> {
    const musicFiles: string[] = [];

    try {
        const entries = await readdir(dirPath, { withFileTypes: true });

        for (const entry of entries) {
            const entryPath = path.join(dirPath, entry.name);

            if (entry.isDirectory()) {
                // Recursively scan subdirectories
                const subDirFiles = await scanDirectoryForMusic(
                    entryPath,
                    fileExtensions
                );
                musicFiles.push(...subDirFiles);
            } else if (entry.isFile()) {
                // Check if file has a music extension
                const ext = path.extname(entry.name).toLowerCase().slice(1);
                if (fileExtensions.includes(ext)) {
                    musicFiles.push(entryPath);
                }
            }
        }
    } catch (error) {
        console.error(`Error scanning directory ${dirPath}:`, error);
    }

    return musicFiles;
}
