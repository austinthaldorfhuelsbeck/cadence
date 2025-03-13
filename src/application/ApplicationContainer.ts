import { ServiceProvider } from '@infrastructure/ServiceProvider';
import { LibraryManager } from './library/LibraryManager';
import { PlaybackManager } from './playback/PlaybackManager';
import { PlaylistManager } from './playlist/PlaylistManager';
import { Library } from '@core/models';
import { MusicMetadataService } from '@infrastructure/audio/MusicMetadataService';

/**
 * ApplicationContainer serves as the central dependency injection container
 * and coordinator for the application.
 *
 * It manages the lifecycle of core application components, ensuring proper
 * initialization and cleanup.
 */
export class ApplicationContainer {
    private static instance: ApplicationContainer;
    private initialized: boolean = false;

    private serviceProvider: ServiceProvider;
    private library: Library;

    private libraryManager: LibraryManager | null = null;
    private playbackManager: PlaybackManager | null = null;
    private playlistManager: PlaylistManager | null = null;

    private constructor() {
        this.serviceProvider = ServiceProvider.getInstance();
        this.library = new Library();
    }

    /**
     * Gets the singleton instance of the application container
     */
    public static getInstance(): ApplicationContainer {
        if (!ApplicationContainer.instance) {
            ApplicationContainer.instance = new ApplicationContainer();
        }
        return ApplicationContainer.instance;
    }

    /**
     * Initializes the application container and all services
     */
    public async initialize(): Promise<void> {
        if (this.initialized) {
            return;
        }

        try {
            console.log('Initializing Application Container...');

            // Initialize service provider
            await this.serviceProvider.initialize();

            // Import the MusicMetadataService directly
            // Normally we would use the ServiceProvider, but we'll need to add getMetadataService() to it

            // Create library manager
            this.libraryManager = new LibraryManager(
                this.serviceProvider.getFileSystemService(),
                new MusicMetadataService(), // Direct instantiation as workaround
                this.serviceProvider.getStorageService()
            );

            // Initialize library manager
            await this.libraryManager.initialize();

            // Get the loaded library
            this.library = this.libraryManager.getLibrary();

            // Create playlist manager (depends on library)
            this.playlistManager = new PlaylistManager(
                this.serviceProvider.getStorageService(),
                this.library
            );

            // Initialize playlist manager
            await this.playlistManager.initialize();

            // Create playback manager (depends on library)
            this.playbackManager = new PlaybackManager(
                this.serviceProvider.getAudioPlayerService(),
                this.serviceProvider.getVisualizationService(),
                this.serviceProvider.getStorageService(),
                this.library
            );

            // Initialize playback manager
            await this.playbackManager.initialize();

            // Set up inter-manager event handlers
            this.setupEventHandlers();

            this.initialized = true;
            console.log('Application Container initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Application Container:', error);
            throw error;
        }
    }

    /**
     * Sets up event handlers between managers
     */
    private setupEventHandlers(): void {
        // When library is updated, refresh system playlists
        if (this.libraryManager && this.playlistManager) {
            this.libraryManager.on('scan-completed', () => {
                this.playlistManager?.updateSystemPlaylists();
            });

            // When tracks are played, update Recently Played playlist
            if (this.playbackManager) {
                this.playbackManager.on('current-track-changed', () => {
                    // Don't update too frequently - debounce this in a real app
                    setTimeout(() => {
                        this.playlistManager?.updateSystemPlaylists();
                    }, 5000);
                });
            }
        }
    }

    /**
     * Gets the library manager
     */
    public getLibraryManager(): LibraryManager {
        if (!this.initialized) {
            throw new Error(
                'Application Container must be initialized before accessing managers'
            );
        }

        if (!this.libraryManager) {
            throw new Error('Library Manager not initialized');
        }

        return this.libraryManager;
    }

    /**
     * Gets the playback manager
     */
    public getPlaybackManager(): PlaybackManager {
        if (!this.initialized) {
            throw new Error(
                'Application Container must be initialized before accessing managers'
            );
        }

        if (!this.playbackManager) {
            throw new Error('Playback Manager not initialized');
        }

        return this.playbackManager;
    }

    /**
     * Gets the playlist manager
     */
    public getPlaylistManager(): PlaylistManager {
        if (!this.initialized) {
            throw new Error(
                'Application Container must be initialized before accessing managers'
            );
        }

        if (!this.playlistManager) {
            throw new Error('Playlist Manager not initialized');
        }

        return this.playlistManager;
    }

    /**
     * Gets the library instance
     */
    public getLibrary(): Library {
        return this.library;
    }

    /**
     * Disposes of all resources
     */
    public dispose(): void {
        if (this.playbackManager) {
            this.playbackManager.dispose();
            this.playbackManager = null;
        }

        if (this.playlistManager) {
            this.playlistManager.dispose();
            this.playlistManager = null;
        }

        if (this.libraryManager) {
            this.libraryManager.dispose();
            this.libraryManager = null;
        }

        this.serviceProvider.dispose();
        this.initialized = false;
    }
}

// Export a helper function to easily access the application container
export function getApplication(): ApplicationContainer {
    return ApplicationContainer.getInstance();
}
