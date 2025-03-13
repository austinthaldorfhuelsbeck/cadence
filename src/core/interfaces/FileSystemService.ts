/**
 * Interface defining file system operations.
 * Abstracts the underlying file system to ensure the domain layer
 * remains independent of platform-specific file access.
 */
export interface FileSystemService {
    /**
     * Reads the contents of a directory
     * @param path Path to the directory
     * @returns Promise resolving to an array of file/directory names
     */
    readDirectory(path: string): Promise<string[]>;

    /**
     * Reads the contents of a file as an ArrayBuffer
     * @param path Path to the file
     * @returns Promise resolving to the file contents as ArrayBuffer
     */
    readFile(path: string): Promise<ArrayBuffer>;

    /**
     * Checks if a path exists
     * @param path Path to check
     * @returns Promise resolving to true if the path exists, false otherwise
     */
    exists(path: string): Promise<boolean>;

    /**
     * Gets information about a file or directory
     * @param path Path to the file or directory
     * @returns Promise resolving to file stats
     */
    getStats(path: string): Promise<FileStats>;

    /**
     * Gets the user's music directory path
     * @returns Promise resolving to the path of the user's music directory
     */
    getMusicDirectory(): Promise<string>;

    /**
     * Shows a dialog to select directories
     * @param options Options for the dialog
     * @returns Promise resolving to an array of selected directory paths
     */
    showDirectoryPicker(options?: DirectoryPickerOptions): Promise<string[]>;

    /**
     * Resolves a path relative to the application
     * @param relativePath Path relative to the application
     * @returns Promise resolving to the absolute path
     */
    resolvePath(relativePath: string): Promise<string>;

    /**
     * Scans a directory recursively for music files
     * @param dirPath Directory to scan
     * @param supportedExtensions Array of supported file extensions (without the dot)
     * @returns Promise resolving to an array of music file paths
     */
    scanDirectoryForMusic(
        dirPath: string,
        supportedExtensions: string[]
    ): Promise<string[]>;
}

/**
 * Interface for file or directory statistics
 */
export interface FileStats {
    size: number;
    isFile: boolean;
    isDirectory: boolean;
    createdAt: Date;
    modifiedAt: Date;
    accessedAt: Date;
}

/**
 * Options for directory picker dialog
 */
export interface DirectoryPickerOptions {
    title?: string;
    defaultPath?: string;
    multiSelections?: boolean;
}
