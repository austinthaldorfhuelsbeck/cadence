import { v4 as uuidv4 } from 'uuid';
import {
    FileSystemService,
    MetadataService,
    StorageService,
    AudioMetadata,
} from '@core/interfaces';
import { Track, Album, Artist, Library } from '@core/models';
import { EventEmitter } from 'events';

/**
 * LibraryManager coordinates operations related to the music library.
 * It handles importing, organizing, and persisting music library data.
 */
export class LibraryManager extends EventEmitter {
    private library: Library;
    private isScanning: boolean = false;

    constructor(
        private fileSystem: FileSystemService,
        private metadataService: MetadataService,
        private storageService: StorageService
    ) {
        super();
        this.library = new Library();
    }

    /**
     * Initializes the library manager, loading existing library data if available
     */
    async initialize(): Promise<void> {
        try {
            const savedLibrary = await this.storageService.loadLibrary();

            if (savedLibrary) {
                this.library = savedLibrary;
                this.emit('library-loaded', this.library);
            } else {
                // Create a new library if none exists
                this.library = new Library();
                await this.saveLibrary();
            }
        } catch (error) {
            console.error('Error initializing library:', error);
            this.library = new Library();
        }
    }

    /**
     * Gets the current library
     */
    getLibrary(): Library {
        return this.library;
    }

    /**
     * Imports music from specified directories
     * @param directories Array of directory paths to scan
     * @returns Promise resolving to the number of tracks imported
     */
    async importMusic(directories: string[]): Promise<number> {
        if (this.isScanning) {
            throw new Error('A scan is already in progress');
        }

        this.isScanning = true;
        this.emit('scan-started', directories);

        try {
            let totalImported = 0;

            for (const directory of directories) {
                // Register directory in the library
                this.library.addDirectory(directory);

                // Get supported file extensions
                const supportedExtensions =
                    this.metadataService.getSupportedFileExtensions();

                // Scan directory for music files
                const musicFiles = await this.fileSystem.scanDirectoryForMusic(
                    directory,
                    supportedExtensions
                );

                this.emit('scan-progress', {
                    currentDirectory: directory,
                    filesFound: musicFiles.length,
                    processedFiles: 0,
                });

                // Process each music file
                let processedCount = 0;
                for (const filePath of musicFiles) {
                    try {
                        const imported = await this.importFile(filePath);
                        if (imported) {
                            totalImported++;
                        }

                        processedCount++;
                        if (processedCount % 10 === 0) {
                            // Update progress every 10 files
                            this.emit('scan-progress', {
                                currentDirectory: directory,
                                filesFound: musicFiles.length,
                                processedFiles: processedCount,
                            });
                        }
                    } catch (error) {
                        console.error(
                            `Error importing file ${filePath}:`,
                            error
                        );
                    }
                }
            }

            // Save the updated library
            await this.saveLibrary();

            this.isScanning = false;
            this.emit('scan-completed', {
                totalImported,
                directories,
            });

            return totalImported;
        } catch (error) {
            this.isScanning = false;
            this.emit('scan-error', error);
            throw error;
        }
    }

    /**
     * Imports a single music file
     * @param filePath Path to the music file
     * @returns Promise resolving to true if the file was imported, false otherwise
     */
    private async importFile(filePath: string): Promise<boolean> {
        try {
            // Check if the file exists
            const exists = await this.fileSystem.exists(filePath);
            if (!exists) {
                return false;
            }

            // Get file stats (size, dates)
            const stats = await this.fileSystem.getStats(filePath);

            // Extract metadata
            const metadata = await this.metadataService.extractMetadata(
                filePath
            );

            // Create a track instance
            const trackId = uuidv4();
            const track = Track.fromMetadata(metadata, filePath, trackId);

            // Add file size from stats
            track.fileSize = stats.size;

            // Create or update album
            const albumId = await this.createOrUpdateAlbum(metadata, trackId);
            // We don't directly link by ID in the Track model - album name is already stored
            // but we still need to create/update the Album entity

            // Create or update artist
            const artistId = await this.createOrUpdateArtist(
                metadata,
                trackId,
                albumId
            );
            // Artist name is already stored in the Track model

            // Add track to library
            this.library.addTrack(track);

            // Store the track
            await this.storageService.saveTrack(track);

            return true;
        } catch (error) {
            console.error(`Failed to import ${filePath}:`, error);
            return false;
        }
    }

    /**
     * Creates or updates an album based on track metadata
     * @param metadata Track metadata
     * @param trackId ID of the track to associate with the album
     * @returns Promise resolving to the album ID or null if no album could be created
     */
    private async createOrUpdateAlbum(
        metadata: AudioMetadata,
        trackId: string
    ): Promise<string | null> {
        if (!metadata.album) {
            return null;
        }

        // Generate a deterministic album ID based on album name and artist
        const albumName = metadata.album || 'Unknown Album';
        const albumArtist =
            metadata.albumArtist || metadata.artist || 'Unknown Artist';
        const albumId = this.generateAlbumId(albumName, albumArtist);

        // Check if album already exists
        let album = this.library.getAlbum(albumId);

        if (!album) {
            // Create new album
            album = new Album({
                id: albumId,
                title: albumName,
                artist: albumArtist,
                year: metadata.year,
                hasArtwork: metadata.hasArtwork || false,
            });

            this.library.addAlbum(album);
        }

        // Add track to album
        album.addTrack(trackId);

        // Save album
        await this.storageService.saveAlbum(album);

        return albumId;
    }

    /**
     * Creates or updates an artist based on track metadata
     * @param metadata Track metadata
     * @param trackId ID of the track to associate with the artist
     * @param albumId ID of the album to associate with the artist
     * @returns Promise resolving to the artist ID or null if no artist could be created
     */
    private async createOrUpdateArtist(
        metadata: AudioMetadata,
        trackId: string,
        albumId: string | null
    ): Promise<string | null> {
        if (!metadata.artist) {
            return null;
        }

        const artistName = metadata.artist;
        // Generate a deterministic artist ID based on artist name
        const artistId = this.generateArtistId(artistName);

        // Check if artist already exists
        let artist = this.library.getArtist(artistId);

        if (!artist) {
            // Create new artist
            artist = new Artist({
                id: artistId,
                name: artistName,
            });

            this.library.addArtist(artist);
        }

        // Add track to artist
        artist.addTrack(trackId);

        // Add album to artist if it exists
        if (albumId) {
            artist.addAlbum(albumId);
        }

        // Add genre if available
        if (metadata.genre && metadata.genre.length > 0) {
            metadata.genre.forEach((genre) => {
                artist.addGenre(genre);
            });
        }

        // Save artist
        await this.storageService.saveArtist(artist);

        return artistId;
    }

    /**
     * Generates a deterministic album ID based on album name and artist
     * @param albumName Album name
     * @param artistName Artist name
     * @returns Album ID
     */
    private generateAlbumId(albumName: string, artistName: string): string {
        // Simple mechanism to generate deterministic IDs
        // In production, you might want a more sophisticated approach
        return `album-${albumName
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-')}-${artistName
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-')}`;
    }

    /**
     * Generates a deterministic artist ID based on artist name
     * @param artistName Artist name
     * @returns Artist ID
     */
    private generateArtistId(artistName: string): string {
        // Simple mechanism to generate deterministic IDs
        return `artist-${artistName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    }

    /**
     * Saves the current library state
     */
    async saveLibrary(): Promise<void> {
        await this.storageService.saveLibrary(this.library);
    }

    /**
     * Gets a track by ID
     * @param id Track ID
     * @returns Track or undefined if not found
     */
    getTrack(id: string): Track | undefined {
        return this.library.getTrack(id);
    }

    /**
     * Searches for tracks, albums, and artists matching a query
     * @param query Search query
     * @returns Search results
     */
    search(query: string): {
        tracks: Track[];
        albums: Album[];
        artists: Artist[];
    } {
        return {
            tracks: this.library.searchTracks(query),
            albums: this.library.searchAlbums(query),
            artists: this.library.searchArtists(query),
        };
    }

    /**
     * Removes a track from the library
     * @param trackId Track ID to remove
     * @returns Promise resolving to true if the track was removed
     */
    async removeTrack(trackId: string): Promise<boolean> {
        const track = this.library.getTrack(trackId);
        if (!track) return false;

        // Remove track from library
        const removed = this.library.removeTrack(trackId);
        if (!removed) return false;

        // Update albums that contain this track
        this.library.getAllAlbums().forEach(async (album) => {
            if (album.trackIds.includes(trackId)) {
                album.removeTrack(trackId);
                await this.storageService.saveAlbum(album);
            }
        });

        // Update artists that contain this track
        this.library.getAllArtists().forEach(async (artist) => {
            if (artist.trackIds.includes(trackId)) {
                artist.removeTrack(trackId);
                await this.storageService.saveArtist(artist);
            }
        });

        // Save library
        await this.saveLibrary();

        // Emit event
        this.emit('track-removed', trackId);

        return true;
    }

    /**
     * Handles cleanup when the manager is no longer needed
     */
    dispose(): void {
        this.removeAllListeners();
    }
}
