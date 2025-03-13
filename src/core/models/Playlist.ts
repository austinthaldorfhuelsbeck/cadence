/**
 * Represents a user-created playlist in the music library.
 * Contains a list of tracks in user-defined order.
 */
export class Playlist {
    /**
     * Unique identifier for the playlist
     */
    id: string;

    /**
     * Name of the playlist
     */
    name: string;

    /**
     * Description of the playlist
     */
    description?: string;

    /**
     * IDs of tracks in the playlist (in order)
     */
    trackIds: string[];

    /**
     * Path to custom artwork for the playlist
     */
    artworkPath?: string;

    /**
     * Date the playlist was created
     */
    dateCreated: Date;

    /**
     * Date the playlist was last modified
     */
    dateModified: Date;

    /**
     * Whether the playlist is one of the system defaults
     */
    isSystem: boolean;

    /**
     * Custom color for the playlist (hex code)
     */
    color?: string;

    constructor(params: {
        id: string;
        name: string;
        description?: string;
        trackIds?: string[];
        artworkPath?: string;
        isSystem?: boolean;
        color?: string;
    }) {
        this.id = params.id;
        this.name = params.name;
        this.description = params.description;
        this.trackIds = params.trackIds || [];
        this.artworkPath = params.artworkPath;
        this.dateCreated = new Date();
        this.dateModified = new Date();
        this.isSystem = params.isSystem || false;
        this.color = params.color;
    }

    /**
     * Adds a track to the end of the playlist
     * @param trackId Track ID to add
     */
    addTrack(trackId: string): void {
        this.trackIds.push(trackId);
        this.dateModified = new Date();
    }

    /**
     * Adds multiple tracks to the end of the playlist
     * @param trackIds Track IDs to add
     */
    addTracks(trackIds: string[]): void {
        this.trackIds.push(...trackIds);
        this.dateModified = new Date();
    }

    /**
     * Inserts a track at a specific position in the playlist
     * @param trackId Track ID to insert
     * @param index Position to insert at (0-based)
     */
    insertTrack(trackId: string, index: number): void {
        if (index >= 0 && index <= this.trackIds.length) {
            this.trackIds.splice(index, 0, trackId);
            this.dateModified = new Date();
        }
    }

    /**
     * Removes a track from the playlist
     * @param trackId Track ID to remove
     * @returns True if the track was removed, false if not found
     */
    removeTrack(trackId: string): boolean {
        const initialLength = this.trackIds.length;
        this.trackIds = this.trackIds.filter((id) => id !== trackId);
        const wasRemoved = initialLength !== this.trackIds.length;

        if (wasRemoved) {
            this.dateModified = new Date();
        }

        return wasRemoved;
    }

    /**
     * Removes a track at a specific position in the playlist
     * @param index Position to remove from (0-based)
     * @returns The removed track ID or undefined if index is invalid
     */
    removeTrackAt(index: number): string | undefined {
        if (index >= 0 && index < this.trackIds.length) {
            const removed = this.trackIds.splice(index, 1)[0];
            this.dateModified = new Date();
            return removed;
        }
        return undefined;
    }

    /**
     * Moves a track from one position to another
     * @param fromIndex Current position (0-based)
     * @param toIndex New position (0-based)
     * @returns True if successful, false if indices are invalid
     */
    moveTrack(fromIndex: number, toIndex: number): boolean {
        if (
            fromIndex >= 0 &&
            fromIndex < this.trackIds.length &&
            toIndex >= 0 &&
            toIndex < this.trackIds.length &&
            fromIndex !== toIndex
        ) {
            const trackId = this.trackIds[fromIndex];
            this.trackIds.splice(fromIndex, 1);
            this.trackIds.splice(toIndex, 0, trackId);
            this.dateModified = new Date();
            return true;
        }
        return false;
    }

    /**
     * Clears all tracks from the playlist
     */
    clear(): void {
        if (this.trackIds.length > 0) {
            this.trackIds = [];
            this.dateModified = new Date();
        }
    }

    /**
     * Gets the number of tracks in the playlist
     * @returns Number of tracks
     */
    getTrackCount(): number {
        return this.trackIds.length;
    }

    /**
     * Sets the playlist artwork
     * @param path Path to artwork
     */
    setArtwork(path: string): void {
        this.artworkPath = path;
        this.dateModified = new Date();
    }

    /**
     * Updates the playlist name
     * @param name New name
     */
    rename(name: string): void {
        this.name = name;
        this.dateModified = new Date();
    }

    /**
     * Updates the playlist description
     * @param description New description
     */
    setDescription(description: string): void {
        this.description = description;
        this.dateModified = new Date();
    }

    /**
     * Sets the playlist color
     * @param color Hex color code
     */
    setColor(color: string): void {
        this.color = color;
        this.dateModified = new Date();
    }
}
