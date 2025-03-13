import {
    AudioPlayerService,
    FileSystemService,
    StorageService,
} from '@core/interfaces';
import { ElectronFileSystemService } from '@infrastructure/electron/ElectronFileSystemService';
import { HowlerAudioPlayerService } from '@infrastructure/audio/HowlerAudioPlayerService';
import { IndexedDBStorageService } from '@infrastructure/storage/IndexedDBStorageService';

/**
 * Service provider that creates and manages service instances.
 * This follows the Service Locator pattern and helps with dependency injection.
 */
export class ServiceProvider {
    private static instance: ServiceProvider;

    private audioPlayerService: AudioPlayerService | null = null;
    private fileSystemService: FileSystemService | null = null;
    private storageService: StorageService | null = null;

    private constructor() {
        // Private constructor to enforce singleton
    }

    /**
     * Gets the singleton instance of the service provider
     * @returns ServiceProvider instance
     */
    public static getInstance(): ServiceProvider {
        if (!ServiceProvider.instance) {
            ServiceProvider.instance = new ServiceProvider();
        }
        return ServiceProvider.instance;
    }

    /**
     * Initializes all services
     * @returns Promise that resolves when all services are initialized
     */
    public async initialize(): Promise<void> {
        // Create service instances
        this.fileSystemService = new ElectronFileSystemService();
        this.audioPlayerService = new HowlerAudioPlayerService();
        this.storageService = new IndexedDBStorageService();

        // Initialize services that require it
        await this.storageService.initialize();
    }

    /**
     * Gets the audio player service
     * @returns AudioPlayerService instance
     */
    public getAudioPlayerService(): AudioPlayerService {
        if (!this.audioPlayerService) {
            this.audioPlayerService = new HowlerAudioPlayerService();
        }
        return this.audioPlayerService;
    }

    /**
     * Gets the file system service
     * @returns FileSystemService instance
     */
    public getFileSystemService(): FileSystemService {
        if (!this.fileSystemService) {
            this.fileSystemService = new ElectronFileSystemService();
        }
        return this.fileSystemService;
    }

    /**
     * Gets the storage service
     * @returns StorageService instance
     */
    public getStorageService(): StorageService {
        if (!this.storageService) {
            this.storageService = new IndexedDBStorageService();
        }
        return this.storageService;
    }

    /**
     * Disposes of all services
     */
    public dispose(): void {
        if (this.audioPlayerService) {
            this.audioPlayerService.dispose();
            this.audioPlayerService = null;
        }

        this.fileSystemService = null;
        this.storageService = null;
    }
}
