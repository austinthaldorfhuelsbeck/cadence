import {
    FileSystemService,
    FileStats,
    DirectoryPickerOptions,
} from '@core/interfaces';

export class ElectronFileSystemService implements FileSystemService {
    async readDirectory(path: string): Promise<string[]> {
        return window.electron.fs.readDirectory(path);
    }

    async readFile(path: string): Promise<ArrayBuffer> {
        return window.electron.fs.readFile(path);
    }

    async exists(path: string): Promise<boolean> {
        return window.electron.fs.exists(path);
    }

    async getStats(path: string): Promise<FileStats> {
        return window.electron.fs.getStats(path);
    }

    async getMusicDirectory(): Promise<string> {
        return window.electron.fs.getMusicDirectory();
    }

    async showDirectoryPicker(
        options?: DirectoryPickerOptions
    ): Promise<string[]> {
        return window.electron.fs.showDirectoryPicker(options);
    }

    async resolvePath(relativePath: string): Promise<string> {
        return window.electron.fs.resolvePath(relativePath);
    }

    /**
     * Scans a directory recursively for music files
     * @param dirPath Directory to scan
     * @param supportedExtensions Array of supported file extensions (without the dot)
     * @returns Promise resolving to an array of music file paths
     */
    async scanDirectoryForMusic(
        dirPath: string,
        supportedExtensions: string[]
    ): Promise<string[]> {
        return window.electron.fs.scanDirectoryForMusic(
            dirPath,
            supportedExtensions
        );
    }
}
