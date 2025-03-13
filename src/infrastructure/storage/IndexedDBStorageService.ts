import { StorageService } from '@core/interfaces';
import { Library, Playlist, Track, Album, Artist } from '@core/models';

// Database configuration
const DB_NAME = 'CadenceMusicDB';
const DB_VERSION = 1;

// Object store names
const STORES = {
    LIBRARY: 'library',
    TRACKS: 'tracks',
    ALBUMS: 'albums',
    ARTISTS: 'artists',
    PLAYLISTS: 'playlists',
    SETTINGS: 'settings',
};

export class IndexedDBStorageService implements StorageService {
    private db: IDBDatabase | null = null;

    async initialize(): Promise<void> {
        if (this.db) {
            return; // Already initialized
        }

        return new Promise<void>((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                // Create object stores if they don't exist
                if (!db.objectStoreNames.contains(STORES.LIBRARY)) {
                    db.createObjectStore(STORES.LIBRARY, { keyPath: 'id' });
                }

                if (!db.objectStoreNames.contains(STORES.TRACKS)) {
                    db.createObjectStore(STORES.TRACKS, { keyPath: 'id' });
                }

                if (!db.objectStoreNames.contains(STORES.ALBUMS)) {
                    db.createObjectStore(STORES.ALBUMS, { keyPath: 'id' });
                }

                if (!db.objectStoreNames.contains(STORES.ARTISTS)) {
                    db.createObjectStore(STORES.ARTISTS, { keyPath: 'id' });
                }

                if (!db.objectStoreNames.contains(STORES.PLAYLISTS)) {
                    db.createObjectStore(STORES.PLAYLISTS, { keyPath: 'id' });
                }

                if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
                    db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
                }
            };

            request.onsuccess = (event) => {
                this.db = (event.target as IDBOpenDBRequest).result;
                resolve();
            };

            request.onerror = (event) => {
                console.error(
                    'Error opening database:',
                    (event.target as IDBOpenDBRequest).error
                );
                reject((event.target as IDBOpenDBRequest).error);
            };
        });
    }

    async saveLibrary(library: Library): Promise<void> {
        await this.ensureInitialized();

        // We'll save a simplified library object with just the necessary data
        // Individual tracks, albums, etc. are saved separately
        const libraryData = {
            id: 'main', // Since we only have one library, use a constant ID
            lastUpdated: library.lastUpdated,
            totalSize: library.totalSize,
            directories: library.directories,
        };

        return this.putObject(STORES.LIBRARY, libraryData);
    }

    async loadLibrary(): Promise<Library | null> {
        await this.ensureInitialized();

        try {
            const libraryData = await this.getObject(STORES.LIBRARY, 'main');

            if (!libraryData) {
                return null;
            }

            // Create a new library
            const library = new Library();

            // Restore basic properties
            library.lastUpdated = new Date(libraryData.lastUpdated);
            library.totalSize = libraryData.totalSize;
            library.directories = libraryData.directories || [];

            // Load all tracks, albums, artists, and playlists
            const tracks = await this.getAllObjects(STORES.TRACKS);
            const albums = await this.getAllObjects(STORES.ALBUMS);
            const artists = await this.getAllObjects(STORES.ARTISTS);
            const playlists = await this.getAllObjects(STORES.PLAYLISTS);

            // Add all entities to the library
            for (const trackData of tracks) {
                const track = this.deserializeTrack(trackData);
                library.addTrack(track);
            }

            for (const albumData of albums) {
                const album = this.deserializeAlbum(albumData);
                library.addAlbum(album);
            }

            for (const artistData of artists) {
                const artist = this.deserializeArtist(artistData);
                library.addArtist(artist);
            }

            for (const playlistData of playlists) {
                const playlist = this.deserializePlaylist(playlistData);
                library.addPlaylist(playlist);
            }

            return library;
        } catch (error) {
            console.error('Error loading library:', error);
            return null;
        }
    }

    async savePlaylists(playlists: Playlist[]): Promise<void> {
        await this.ensureInitialized();

        // Use a transaction for better performance
        return new Promise<void>((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }

            const transaction = this.db.transaction(
                [STORES.PLAYLISTS],
                'readwrite'
            );
            const store = transaction.objectStore(STORES.PLAYLISTS);

            transaction.oncomplete = () => {
                resolve();
            };

            transaction.onerror = (event) => {
                console.error(
                    'Error saving playlists:',
                    (event.target as any).error
                );
                reject((event.target as any).error);
            };

            // Clear existing playlists and add new ones
            const clearRequest = store.clear();

            clearRequest.onsuccess = () => {
                for (const playlist of playlists) {
                    store.add(this.serializePlaylist(playlist));
                }
            };
        });
    }

    async loadPlaylists(): Promise<Playlist[]> {
        await this.ensureInitialized();

        try {
            const playlistsData = await this.getAllObjects(STORES.PLAYLISTS);

            return playlistsData.map((playlistData) =>
                this.deserializePlaylist(playlistData)
            );
        } catch (error) {
            console.error('Error loading playlists:', error);
            return [];
        }
    }

    async savePlaylist(playlist: Playlist): Promise<void> {
        await this.ensureInitialized();
        return this.putObject(
            STORES.PLAYLISTS,
            this.serializePlaylist(playlist)
        );
    }

    async loadPlaylist(id: string): Promise<Playlist | null> {
        await this.ensureInitialized();

        try {
            const playlistData = await this.getObject(STORES.PLAYLISTS, id);

            if (!playlistData) {
                return null;
            }

            return this.deserializePlaylist(playlistData);
        } catch (error) {
            console.error(`Error loading playlist ${id}:`, error);
            return null;
        }
    }

    async deletePlaylist(id: string): Promise<void> {
        await this.ensureInitialized();
        return this.deleteObject(STORES.PLAYLISTS, id);
    }

    async saveTrack(track: Track): Promise<void> {
        await this.ensureInitialized();
        return this.putObject(STORES.TRACKS, this.serializeTrack(track));
    }

    async loadTrack(id: string): Promise<Track | null> {
        await this.ensureInitialized();

        try {
            const trackData = await this.getObject(STORES.TRACKS, id);

            if (!trackData) {
                return null;
            }

            return this.deserializeTrack(trackData);
        } catch (error) {
            console.error(`Error loading track ${id}:`, error);
            return null;
        }
    }

    async saveAlbum(album: Album): Promise<void> {
        await this.ensureInitialized();
        return this.putObject(STORES.ALBUMS, this.serializeAlbum(album));
    }

    async loadAlbum(id: string): Promise<Album | null> {
        await this.ensureInitialized();

        try {
            const albumData = await this.getObject(STORES.ALBUMS, id);

            if (!albumData) {
                return null;
            }

            return this.deserializeAlbum(albumData);
        } catch (error) {
            console.error(`Error loading album ${id}:`, error);
            return null;
        }
    }

    async saveArtist(artist: Artist): Promise<void> {
        await this.ensureInitialized();
        return this.putObject(STORES.ARTISTS, this.serializeArtist(artist));
    }

    async loadArtist(id: string): Promise<Artist | null> {
        await this.ensureInitialized();

        try {
            const artistData = await this.getObject(STORES.ARTISTS, id);

            if (!artistData) {
                return null;
            }

            return this.deserializeArtist(artistData);
        } catch (error) {
            console.error(`Error loading artist ${id}:`, error);
            return null;
        }
    }

    async saveSettings(settings: Record<string, any>): Promise<void> {
        await this.ensureInitialized();

        // Convert settings object to array of key-value pairs
        const settingsEntries = Object.entries(settings).map(
            ([key, value]) => ({
                key,
                value,
            })
        );

        return new Promise<void>((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }

            const transaction = this.db.transaction(
                [STORES.SETTINGS],
                'readwrite'
            );
            const store = transaction.objectStore(STORES.SETTINGS);

            transaction.oncomplete = () => {
                resolve();
            };

            transaction.onerror = (event) => {
                console.error(
                    'Error saving settings:',
                    (event.target as any).error
                );
                reject((event.target as any).error);
            };

            // Clear existing settings and add new ones
            const clearRequest = store.clear();

            clearRequest.onsuccess = () => {
                for (const entry of settingsEntries) {
                    store.add(entry);
                }
            };
        });
    }

    async loadSettings(): Promise<Record<string, any>> {
        await this.ensureInitialized();

        try {
            const settingsEntries = await this.getAllObjects(STORES.SETTINGS);

            // Convert array of key-value pairs back to object
            const settings: Record<string, any> = {};
            for (const entry of settingsEntries) {
                settings[entry.key] = entry.value;
            }

            return settings;
        } catch (error) {
            console.error('Error loading settings:', error);
            return {};
        }
    }

    async clear(): Promise<void> {
        await this.ensureInitialized();

        return new Promise<void>((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }

            const storeNames = Object.values(STORES);
            const transaction = this.db.transaction(storeNames, 'readwrite');

            let completed = 0;
            let hasError = false;

            transaction.oncomplete = () => {
                resolve();
            };

            transaction.onerror = (event) => {
                console.error(
                    'Error clearing database:',
                    (event.target as any).error
                );
                hasError = true;
                reject((event.target as any).error);
            };

            for (const storeName of storeNames) {
                const store = transaction.objectStore(storeName);
                const request = store.clear();

                request.onsuccess = () => {
                    completed++;
                    if (completed === storeNames.length && !hasError) {
                        // Transaction will automatically complete
                    }
                };
            }
        });
    }

    // Helper methods

    private async ensureInitialized(): Promise<void> {
        if (!this.db) {
            await this.initialize();
        }
    }

    private putObject(storeName: string, object: any): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }

            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(object);

            request.onsuccess = () => {
                resolve();
            };

            request.onerror = (event) => {
                console.error(
                    `Error storing object in ${storeName}:`,
                    (event.target as IDBRequest).error
                );
                reject((event.target as IDBRequest).error);
            };
        });
    }

    private getObject(storeName: string, id: string): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }

            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(id);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = (event) => {
                console.error(
                    `Error getting object from ${storeName}:`,
                    (event.target as IDBRequest).error
                );
                reject((event.target as IDBRequest).error);
            };
        });
    }

    private getAllObjects(storeName: string): Promise<any[]> {
        return new Promise<any[]>((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }

            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => {
                resolve(request.result || []);
            };

            request.onerror = (event) => {
                console.error(
                    `Error getting all objects from ${storeName}:`,
                    (event.target as IDBRequest).error
                );
                reject((event.target as IDBRequest).error);
            };
        });
    }

    private deleteObject(storeName: string, id: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }

            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);

            request.onsuccess = () => {
                resolve();
            };

            request.onerror = (event) => {
                console.error(
                    `Error deleting object from ${storeName}:`,
                    (event.target as IDBRequest).error
                );
                reject((event.target as IDBRequest).error);
            };
        });
    }

    // Serialization/deserialization methods

    private serializeTrack(track: Track): any {
        // Convert Date objects to ISO strings for storage
        return {
            ...track,
            dateAdded: track.dateAdded.toISOString(),
            lastPlayed: track.lastPlayed
                ? track.lastPlayed.toISOString()
                : undefined,
        };
    }

    private deserializeTrack(data: any): Track {
        // Convert ISO strings back to Date objects
        return new Track({
            id: data.id,
            title: data.title,
            artist: data.artist,
            albumArtist: data.albumArtist,
            album: data.album,
            genres: data.genres,
            year: data.year,
            trackNumber: data.trackNumber,
            trackTotal: data.trackTotal,
            discNumber: data.discNumber,
            discTotal: data.discTotal,
            duration: data.duration,
            filePath: data.filePath,
            format: data.format,
            bitrate: data.bitrate,
            sampleRate: data.sampleRate,
            fileSize: data.fileSize,
            hasArtwork: data.hasArtwork,
            additionalInfo: data.additionalInfo,
        });
    }

    private serializeAlbum(album: Album): any {
        return {
            ...album,
            dateAdded: album.dateAdded.toISOString(),
        };
    }

    private deserializeAlbum(data: any): Album {
        const album = new Album({
            id: data.id,
            title: data.title,
            artist: data.artist,
            year: data.year,
            genres: data.genres,
            trackIds: data.trackIds,
            artworkPath: data.artworkPath,
            hasArtwork: data.hasArtwork,
        });

        album.dateAdded = new Date(data.dateAdded);

        return album;
    }

    private serializeArtist(artist: Artist): any {
        return {
            ...artist,
            dateAdded: artist.dateAdded.toISOString(),
        };
    }

    private deserializeArtist(data: any): Artist {
        const artist = new Artist({
            id: data.id,
            name: data.name,
            albumIds: data.albumIds,
            trackIds: data.trackIds,
            genres: data.genres,
            imagePath: data.imagePath,
            info: data.info,
        });

        artist.dateAdded = new Date(data.dateAdded);

        return artist;
    }

    private serializePlaylist(playlist: Playlist): any {
        return {
            ...playlist,
            dateCreated: playlist.dateCreated.toISOString(),
            dateModified: playlist.dateModified.toISOString(),
        };
    }

    private deserializePlaylist(data: any): Playlist {
        const playlist = new Playlist({
            id: data.id,
            name: data.name,
            description: data.description,
            trackIds: data.trackIds,
            artworkPath: data.artworkPath,
            isSystem: data.isSystem,
            color: data.color,
        });

        playlist.dateCreated = new Date(data.dateCreated);
        playlist.dateModified = new Date(data.dateModified);

        return playlist;
    }
}
