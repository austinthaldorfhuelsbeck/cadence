/**
 * Represents an album in the music library.
 * Contains metadata about the album and references to its tracks.
 */
export class Album {
    /**
     * Unique identifier for the album
     */
    id: string;

    /**
     * Title of the album
     */
    title: string;

    /**
     * Primary artist of the album
     */
    artist: string;

    /**
     * Year the album was released
     */
    year?: number;

    /**
     * Genres associated with the album
     */
    genres: string[];

    /**
     * Track IDs belonging to this album
     */
    trackIds: string[];

    /**
     * Path to album artwork (if available separately)
     */
    artworkPath?: string;

    /**
     * Whether album has artwork available
     */
    hasArtwork: boolean;

    /**
     * Date the album was added to the library
     */
    dateAdded: Date;

    constructor(params: {
        id: string;
        title: string;
        artist: string;
        year?: number;
        genres?: string[];
        trackIds?: string[];
        artworkPath?: string;
        hasArtwork?: boolean;
    }) {
        this.id = params.id;
        this.title = params.title;
        this.artist = params.artist;
        this.year = params.year;
        this.genres = params.genres || [];
        this.trackIds = params.trackIds || [];
        this.artworkPath = params.artworkPath;
        this.hasArtwork = params.hasArtwork || false;
        this.dateAdded = new Date();
    }

    /**
     * Adds a track ID to the album
     * @param trackId Track ID to add
     */
    addTrack(trackId: string): void {
        if (!this.trackIds.includes(trackId)) {
            this.trackIds.push(trackId);
        }
    }

    /**
     * Removes a track ID from the album
     * @param trackId Track ID to remove
     */
    removeTrack(trackId: string): void {
        this.trackIds = this.trackIds.filter((id) => id !== trackId);
    }

    /**
     * Gets the number of tracks in the album
     * @returns Number of tracks
     */
    getTrackCount(): number {
        return this.trackIds.length;
    }

    /**
     * Sets the artwork path
     * @param path Path to artwork
     */
    setArtwork(path: string): void {
        this.artworkPath = path;
        this.hasArtwork = true;
    }

    /**
     * Gets a display name combining title and artist
     * @returns Display name
     */
    getDisplayName(): string {
        let display = this.title;
        if (this.artist) {
            display += ` - ${this.artist}`;
        }
        if (this.year) {
            display += ` (${this.year})`;
        }
        return display;
    }
}
