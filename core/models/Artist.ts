/**
 * Represents an artist in the music library.
 * Contains metadata about the artist and references to albums and tracks.
 */
export class Artist {
    /**
     * Unique identifier for the artist
     */
    id: string;

    /**
     * Name of the artist
     */
    name: string;

    /**
     * IDs of albums by this artist
     */
    albumIds: string[];

    /**
     * IDs of tracks by this artist
     */
    trackIds: string[];

    /**
     * Genres associated with the artist
     */
    genres: string[];

    /**
     * Path to artist image (if available)
     */
    imagePath?: string;

    /**
     * Additional information about the artist
     */
    info?: string;

    /**
     * Date the artist was added to the library
     */
    dateAdded: Date;

    constructor(params: {
        id: string;
        name: string;
        albumIds?: string[];
        trackIds?: string[];
        genres?: string[];
        imagePath?: string;
        info?: string;
    }) {
        this.id = params.id;
        this.name = params.name;
        this.albumIds = params.albumIds || [];
        this.trackIds = params.trackIds || [];
        this.genres = params.genres || [];
        this.imagePath = params.imagePath;
        this.info = params.info;
        this.dateAdded = new Date();
    }

    /**
     * Adds an album ID to the artist
     * @param albumId Album ID to add
     */
    addAlbum(albumId: string): void {
        if (!this.albumIds.includes(albumId)) {
            this.albumIds.push(albumId);
        }
    }

    /**
     * Removes an album ID from the artist
     * @param albumId Album ID to remove
     */
    removeAlbum(albumId: string): void {
        this.albumIds = this.albumIds.filter((id) => id !== albumId);
    }

    /**
     * Adds a track ID to the artist
     * @param trackId Track ID to add
     */
    addTrack(trackId: string): void {
        if (!this.trackIds.includes(trackId)) {
            this.trackIds.push(trackId);
        }
    }

    /**
     * Removes a track ID from the artist
     * @param trackId Track ID to remove
     */
    removeTrack(trackId: string): void {
        this.trackIds = this.trackIds.filter((id) => id !== trackId);
    }

    /**
     * Gets the number of albums by the artist
     * @returns Number of albums
     */
    getAlbumCount(): number {
        return this.albumIds.length;
    }

    /**
     * Gets the number of tracks by the artist
     * @returns Number of tracks
     */
    getTrackCount(): number {
        return this.trackIds.length;
    }

    /**
     * Adds a genre to the artist
     * @param genre Genre to add
     */
    addGenre(genre: string): void {
        if (!this.genres.includes(genre)) {
            this.genres.push(genre);
        }
    }

    /**
     * Sets the artist image path
     * @param path Path to image
     */
    setImage(path: string): void {
        this.imagePath = path;
    }
}
