import { Library, Playlist, Track, Album, Artist } from '../models';

/**
 * Interface defining data storage operations.
 * Abstracts the underlying storage mechanism to ensure the domain layer
 * remains independent of specific database technologies.
 */
export interface StorageService {
    /**
     * Initializes the storage
     * @returns Promise that resolves when storage is initialized
     */
    initialize(): Promise<void>;

    /**
     * Saves the library
     * @param library Library to save
     * @returns Promise that resolves when the library is saved
     */
    saveLibrary(library: Library): Promise<void>;

    /**
     * Loads the library
     * @returns Promise resolving to the library or null if none exists
     */
    loadLibrary(): Promise<Library | null>;

    /**
     * Saves all playlists
     * @param playlists Playlists to save
     * @returns Promise that resolves when playlists are saved
     */
    savePlaylists(playlists: Playlist[]): Promise<void>;

    /**
     * Loads all playlists
     * @returns Promise resolving to an array of playlists
     */
    loadPlaylists(): Promise<Playlist[]>;

    /**
     * Saves a single playlist
     * @param playlist Playlist to save
     * @returns Promise that resolves when the playlist is saved
     */
    savePlaylist(playlist: Playlist): Promise<void>;

    /**
     * Loads a single playlist by ID
     * @param id ID of the playlist to load
     * @returns Promise resolving to the playlist or null if not found
     */
    loadPlaylist(id: string): Promise<Playlist | null>;

    /**
     * Deletes a playlist
     * @param id ID of the playlist to delete
     * @returns Promise that resolves when the playlist is deleted
     */
    deletePlaylist(id: string): Promise<void>;

    /**
     * Saves a track
     * @param track Track to save
     * @returns Promise that resolves when the track is saved
     */
    saveTrack(track: Track): Promise<void>;

    /**
     * Loads a track by ID
     * @param id ID of the track to load
     * @returns Promise resolving to the track or null if not found
     */
    loadTrack(id: string): Promise<Track | null>;

    /**
     * Saves an album
     * @param album Album to save
     * @returns Promise that resolves when the album is saved
     */
    saveAlbum(album: Album): Promise<void>;

    /**
     * Loads an album by ID
     * @param id ID of the album to load
     * @returns Promise resolving to the album or null if not found
     */
    loadAlbum(id: string): Promise<Album | null>;

    /**
     * Saves an artist
     * @param artist Artist to save
     * @returns Promise that resolves when the artist is saved
     */
    saveArtist(artist: Artist): Promise<void>;

    /**
     * Loads an artist by ID
     * @param id ID of the artist to load
     * @returns Promise resolving to the artist or null if not found
     */
    loadArtist(id: string): Promise<Artist | null>;

    /**
     * Saves application settings
     * @param settings Settings to save
     * @returns Promise that resolves when settings are saved
     */
    saveSettings(settings: Record<string, any>): Promise<void>;

    /**
     * Loads application settings
     * @returns Promise resolving to the settings
     */
    loadSettings(): Promise<Record<string, any>>;

    /**
     * Clears all data from storage
     * @returns Promise that resolves when storage is cleared
     */
    clear(): Promise<void>;
}
