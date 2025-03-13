import { AudioMetadata } from '../interfaces/MetadataService';

/**
 * Represents a single audio track in the music library.
 * Contains all metadata and file information for a music file.
 */
export class Track {
    /**
     * Unique identifier for the track
     */
    id: string;

    /**
     * Title of the track
     */
    title: string;

    /**
     * Artist name
     */
    artist: string;

    /**
     * Album artist name (might differ from track artist)
     */
    albumArtist?: string;

    /**
     * Album name
     */
    album?: string;

    /**
     * Genre(s) of the track
     */
    genres: string[];

    /**
     * Year the track was released
     */
    year?: number;

    /**
     * Track number in album
     */
    trackNumber?: number;

    /**
     * Total number of tracks in album
     */
    trackTotal?: number;

    /**
     * Disc number for multi-disc albums
     */
    discNumber?: number;

    /**
     * Total number of discs in album
     */
    discTotal?: number;

    /**
     * Duration of the track in seconds
     */
    duration: number;

    /**
     * File path to the track
     */
    filePath: string;

    /**
     * File format (mp3, flac, etc.)
     */
    format: string;

    /**
     * Bitrate in kbps
     */
    bitrate?: number;

    /**
     * Sample rate in Hz
     */
    sampleRate?: number;

    /**
     * Size of the file in bytes
     */
    fileSize?: number;

    /**
     * Date the track was added to the library
     */
    dateAdded: Date;

    /**
     * Date the track was last played
     */
    lastPlayed?: Date;

    /**
     * Number of times the track has been played
     */
    playCount: number;

    /**
     * User rating (0-5)
     */
    rating?: number;

    /**
     * Whether the track has embedded artwork
     */
    hasArtwork: boolean;

    /**
     * Additional metadata that doesn't fit standard fields
     */
    additionalInfo: Record<string, any>;

    constructor(params: {
        id: string;
        title: string;
        artist: string;
        duration: number;
        filePath: string;
        format: string;
        albumArtist?: string;
        album?: string;
        genres?: string[];
        year?: number;
        trackNumber?: number;
        trackTotal?: number;
        discNumber?: number;
        discTotal?: number;
        bitrate?: number;
        sampleRate?: number;
        fileSize?: number;
        hasArtwork?: boolean;
        additionalInfo?: Record<string, any>;
    }) {
        this.id = params.id;
        this.title = params.title;
        this.artist = params.artist;
        this.albumArtist = params.albumArtist;
        this.album = params.album;
        this.genres = params.genres || [];
        this.year = params.year;
        this.trackNumber = params.trackNumber;
        this.trackTotal = params.trackTotal;
        this.discNumber = params.discNumber;
        this.discTotal = params.discTotal;
        this.duration = params.duration;
        this.filePath = params.filePath;
        this.format = params.format;
        this.bitrate = params.bitrate;
        this.sampleRate = params.sampleRate;
        this.fileSize = params.fileSize;
        this.dateAdded = new Date();
        this.playCount = 0;
        this.hasArtwork = params.hasArtwork || false;
        this.additionalInfo = params.additionalInfo || {};
    }

    /**
     * Creates a Track instance from metadata
     * @param metadata Extracted audio metadata
     * @param filePath Path to the audio file
     * @param id Unique identifier (optional, will generate if not provided)
     * @returns New Track instance
     */
    static fromMetadata(
        metadata: AudioMetadata,
        filePath: string,
        id?: string
    ): Track {
        return new Track({
            id: id || generateUniqueId(),
            title: metadata.title || getFilenameFromPath(filePath),
            artist: metadata.artist || 'Unknown Artist',
            albumArtist: metadata.albumArtist,
            album: metadata.album || 'Unknown Album',
            genres: metadata.genre || [],
            year: metadata.year,
            trackNumber: metadata.track?.no,
            trackTotal: metadata.track?.of,
            discNumber: metadata.disk?.no,
            discTotal: metadata.disk?.of,
            duration: metadata.duration || 0,
            filePath: filePath,
            format: metadata.format || getFormatFromPath(filePath),
            bitrate: metadata.bitrate,
            sampleRate: metadata.sampleRate,
            fileSize: metadata.fileSize,
            hasArtwork: metadata.hasArtwork || false,
        });
    }

    /**
     * Formats the duration as mm:ss
     * @returns Formatted duration string
     */
    getDurationFormatted(): string {
        const minutes = Math.floor(this.duration / 60);
        const seconds = Math.floor(this.duration % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    /**
     * Records that the track was played
     */
    markAsPlayed(): void {
        this.lastPlayed = new Date();
        this.playCount++;
    }

    /**
     * Sets the user rating for the track
     * @param rating Rating from 0-5
     */
    setRating(rating: number): void {
        if (rating >= 0 && rating <= 5) {
            this.rating = rating;
        }
    }

    /**
     * Gets a display name combining title and artist
     * @returns Display name
     */
    getDisplayName(): string {
        return `${this.title} - ${this.artist}`;
    }
}

/**
 * Generates a unique ID (placeholder implementation)
 * @returns Unique ID string
 */
function generateUniqueId(): string {
    return (
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15)
    );
}

/**
 * Extracts filename from a path
 * @param path File path
 * @returns Filename without extension
 */
function getFilenameFromPath(path: string): string {
    const parts = path.split(/[\/\\]/);
    const filename = parts[parts.length - 1];
    return filename.split('.').slice(0, -1).join('.');
}

/**
 * Gets file format from path
 * @param path File path
 * @returns File format (extension)
 */
function getFormatFromPath(path: string): string {
    const parts = path.split('.');
    return parts[parts.length - 1].toLowerCase();
}
