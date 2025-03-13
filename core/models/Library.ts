import { Track } from './Track';
import { Album } from './Album';
import { Artist } from './Artist';
import { Playlist } from './Playlist';

/**
 * Represents the entire music library.
 * Manages collections of tracks, albums, artists, and playlists.
 */
export class Library {
    /**
     * Map of track ID to Track
     */
    private tracks: Map<string, Track>;

    /**
     * Map of album ID to Album
     */
    private albums: Map<string, Album>;

    /**
     * Map of artist ID to Artist
     */
    private artists: Map<string, Artist>;

    /**
     * Map of playlist ID to Playlist
     */
    private playlists: Map<string, Playlist>;

    /**
     * Date the library was last updated
     */
    lastUpdated: Date;

    /**
     * Total size of the library in bytes
     */
    totalSize: number;

    /**
     * Location of the library scans
     */
    directories: string[];

    constructor() {
        this.tracks = new Map<string, Track>();
        this.albums = new Map<string, Album>();
        this.artists = new Map<string, Artist>();
        this.playlists = new Map<string, Playlist>();
        this.lastUpdated = new Date();
        this.totalSize = 0;
        this.directories = [];
    }

    /**
     * Adds a track to the library
     * @param track Track to add
     */
    addTrack(track: Track): void {
        this.tracks.set(track.id, track);
        this.updateLastModified();

        // Update total size
        if (track.fileSize) {
            this.totalSize += track.fileSize;
        }
    }

    /**
     * Gets a track by ID
     * @param id Track ID
     * @returns Track or undefined if not found
     */
    getTrack(id: string): Track | undefined {
        return this.tracks.get(id);
    }

    /**
     * Removes a track from the library
     * @param id Track ID to remove
     * @returns True if the track was removed, false if not found
     */
    removeTrack(id: string): boolean {
        const track = this.tracks.get(id);
        if (track) {
            // Update total size
            if (track.fileSize) {
                this.totalSize -= track.fileSize;
            }

            this.tracks.delete(id);
            this.updateLastModified();

            // Remove from playlists
            this.playlists.forEach((playlist) => {
                playlist.removeTrack(id);
            });

            return true;
        }
        return false;
    }

    /**
     * Adds an album to the library
     * @param album Album to add
     */
    addAlbum(album: Album): void {
        this.albums.set(album.id, album);
        this.updateLastModified();
    }

    /**
     * Gets an album by ID
     * @param id Album ID
     * @returns Album or undefined if not found
     */
    getAlbum(id: string): Album | undefined {
        return this.albums.get(id);
    }

    /**
     * Removes an album from the library
     * @param id Album ID to remove
     * @returns True if the album was removed, false if not found
     */
    removeAlbum(id: string): boolean {
        if (this.albums.has(id)) {
            this.albums.delete(id);
            this.updateLastModified();
            return true;
        }
        return false;
    }

    /**
     * Adds an artist to the library
     * @param artist Artist to add
     */
    addArtist(artist: Artist): void {
        this.artists.set(artist.id, artist);
        this.updateLastModified();
    }

    /**
     * Gets an artist by ID
     * @param id Artist ID
     * @returns Artist or undefined if not found
     */
    getArtist(id: string): Artist | undefined {
        return this.artists.get(id);
    }

    /**
     * Removes an artist from the library
     * @param id Artist ID to remove
     * @returns True if the artist was removed, false if not found
     */
    removeArtist(id: string): boolean {
        if (this.artists.has(id)) {
            this.artists.delete(id);
            this.updateLastModified();
            return true;
        }
        return false;
    }

    /**
     * Adds a playlist to the library
     * @param playlist Playlist to add
     */
    addPlaylist(playlist: Playlist): void {
        this.playlists.set(playlist.id, playlist);
        this.updateLastModified();
    }

    /**
     * Gets a playlist by ID
     * @param id Playlist ID
     * @returns Playlist or undefined if not found
     */
    getPlaylist(id: string): Playlist | undefined {
        return this.playlists.get(id);
    }

    /**
     * Removes a playlist from the library
     * @param id Playlist ID to remove
     * @returns True if the playlist was removed, false if not found
     */
    removePlaylist(id: string): boolean {
        if (this.playlists.has(id)) {
            this.playlists.delete(id);
            this.updateLastModified();
            return true;
        }
        return false;
    }

    /**
     * Gets all tracks in the library
     * @returns Array of Track objects
     */
    getAllTracks(): Track[] {
        return Array.from(this.tracks.values());
    }

    /**
     * Gets all albums in the library
     * @returns Array of Album objects
     */
    getAllAlbums(): Album[] {
        return Array.from(this.albums.values());
    }

    /**
     * Gets all artists in the library
     * @returns Array of Artist objects
     */
    getAllArtists(): Artist[] {
        return Array.from(this.artists.values());
    }

    /**
     * Gets all playlists in the library
     * @returns Array of Playlist objects
     */
    getAllPlaylists(): Playlist[] {
        return Array.from(this.playlists.values());
    }

    /**
     * Gets the number of tracks in the library
     * @returns Number of tracks
     */
    getTrackCount(): number {
        return this.tracks.size;
    }

    /**
     * Gets the number of albums in the library
     * @returns Number of albums
     */
    getAlbumCount(): number {
        return this.albums.size;
    }

    /**
     * Gets the number of artists in the library
     * @returns Number of artists
     */
    getArtistCount(): number {
        return this.artists.size;
    }

    /**
     * Gets the number of playlists in the library
     * @returns Number of playlists
     */
    getPlaylistCount(): number {
        return this.playlists.size;
    }

    /**
     * Gets the total duration of all tracks in the library
     * @returns Total duration in seconds
     */
    getTotalDuration(): number {
        let totalDuration = 0;
        this.tracks.forEach((track) => {
            totalDuration += track.duration;
        });
        return totalDuration;
    }

    /**
     * Adds a directory to the library's scan list
     * @param directory Directory path
     */
    addDirectory(directory: string): void {
        if (!this.directories.includes(directory)) {
            this.directories.push(directory);
            this.updateLastModified();
        }
    }

    /**
     * Removes a directory from the library's scan list
     * @param directory Directory path
     * @returns True if removed, false if not found
     */
    removeDirectory(directory: string): boolean {
        const index = this.directories.indexOf(directory);
        if (index !== -1) {
            this.directories.splice(index, 1);
            this.updateLastModified();
            return true;
        }
        return false;
    }

    /**
     * Updates the last modified timestamp
     */
    private updateLastModified(): void {
        this.lastUpdated = new Date();
    }

    /**
     * Gets tracks by album ID
     * @param albumId Album ID
     * @returns Array of tracks in the album
     */
    getTracksByAlbum(albumId: string): Track[] {
        const album = this.albums.get(albumId);
        if (!album) return [];

        return album.trackIds
            .map((id) => this.tracks.get(id))
            .filter((track) => track !== undefined) as Track[];
    }

    /**
     * Gets tracks by artist ID
     * @param artistId Artist ID
     * @returns Array of tracks by the artist
     */
    getTracksByArtist(artistId: string): Track[] {
        const artist = this.artists.get(artistId);
        if (!artist) return [];

        return artist.trackIds
            .map((id) => this.tracks.get(id))
            .filter((track) => track !== undefined) as Track[];
    }

    /**
     * Gets albums by artist ID
     * @param artistId Artist ID
     * @returns Array of albums by the artist
     */
    getAlbumsByArtist(artistId: string): Album[] {
        const artist = this.artists.get(artistId);
        if (!artist) return [];

        return artist.albumIds
            .map((id) => this.albums.get(id))
            .filter((album) => album !== undefined) as Album[];
    }

    /**
     * Gets tracks by playlist ID
     * @param playlistId Playlist ID
     * @returns Array of tracks in the playlist (in playlist order)
     */
    getTracksByPlaylist(playlistId: string): Track[] {
        const playlist = this.playlists.get(playlistId);
        if (!playlist) return [];

        return playlist.trackIds
            .map((id) => this.tracks.get(id))
            .filter((track) => track !== undefined) as Track[];
    }

    /**
     * Searches for tracks matching a query
     * @param query Search query
     * @returns Array of matching tracks
     */
    searchTracks(query: string): Track[] {
        const lowerQuery = query.toLowerCase();
        return this.getAllTracks().filter(
            (track) =>
                track.title.toLowerCase().includes(lowerQuery) ||
                track.artist.toLowerCase().includes(lowerQuery) ||
                (track.album && track.album.toLowerCase().includes(lowerQuery))
        );
    }

    /**
     * Searches for albums matching a query
     * @param query Search query
     * @returns Array of matching albums
     */
    searchAlbums(query: string): Album[] {
        const lowerQuery = query.toLowerCase();
        return this.getAllAlbums().filter(
            (album) =>
                album.title.toLowerCase().includes(lowerQuery) ||
                album.artist.toLowerCase().includes(lowerQuery)
        );
    }

    /**
     * Searches for artists matching a query
     * @param query Search query
     * @returns Array of matching artists
     */
    searchArtists(query: string): Artist[] {
        const lowerQuery = query.toLowerCase();
        return this.getAllArtists().filter((artist) =>
            artist.name.toLowerCase().includes(lowerQuery)
        );
    }

    /**
     * Searches for playlists matching a query
     * @param query Search query
     * @returns Array of matching playlists
     */
    searchPlaylists(query: string): Playlist[] {
        const lowerQuery = query.toLowerCase();
        return this.getAllPlaylists().filter(
            (playlist) =>
                playlist.name.toLowerCase().includes(lowerQuery) ||
                (playlist.description &&
                    playlist.description.toLowerCase().includes(lowerQuery))
        );
    }

    /**
     * Gets library statistics
     * @returns Object with library statistics
     */
    getStatistics(): LibraryStats {
        return {
            trackCount: this.getTrackCount(),
            albumCount: this.getAlbumCount(),
            artistCount: this.getArtistCount(),
            playlistCount: this.getPlaylistCount(),
            totalDuration: this.getTotalDuration(),
            totalSize: this.totalSize,
            lastUpdated: this.lastUpdated,
        };
    }
}

/**
 * Interface for library statistics
 */
interface LibraryStats {
    trackCount: number;
    albumCount: number;
    artistCount: number;
    playlistCount: number;
    totalDuration: number;
    totalSize: number;
    lastUpdated: Date;
}
