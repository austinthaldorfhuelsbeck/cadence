import { FileStats, DirectoryPickerOptions } from '@core/interfaces';

declare global {
    interface Window {
        electron: {
            fs: {
                readDirectory: (path: string) => Promise<string[]>;
                readFile: (path: string) => Promise<ArrayBuffer>;
                getStats: (path: string) => Promise<FileStats>;
                exists: (path: string) => Promise<boolean>;
                getMusicDirectory: () => Promise<string>;
                showDirectoryPicker: (
                    options?: DirectoryPickerOptions
                ) => Promise<string[]>;
                resolvePath: (relativePath: string) => Promise<string>;
                scanDirectoryForMusic: (
                    dirPath: string,
                    fileExtensions: string[]
                ) => Promise<string[]>;
            };
            app: {
                on: (
                    channel: string,
                    callback: (...args: any[]) => void
                ) => void;
                removeAllListeners: (channel: string) => void;
            };
        };
    }
}

// This export is needed to make this file a module
export {};
