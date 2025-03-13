/**
 * Interface defining music metadata operations.
 * Abstracts the underlying metadata extraction to ensure the domain layer
 * remains independent of specific metadata libraries.
 */
export interface MetadataService {
    /**
     * Extracts metadata from an audio file
     * @param filePath Path to the audio file
     * @returns Promise resolving to the extracted metadata
     */
    extractMetadata(filePath: string): Promise<AudioMetadata>;

    /**
     * Extracts metadata from an audio buffer
     * @param buffer Audio file buffer
     * @param fileType File type (e.g., 'mp3', 'flac')
     * @returns Promise resolving to the extracted metadata
     */
    extractMetadataFromBuffer(
        buffer: ArrayBuffer,
        fileType: string
    ): Promise<AudioMetadata>;

    /**
     * Extracts album artwork from an audio file
     * @param filePath Path to the audio file
     * @returns Promise resolving to the artwork as a Buffer or null if none exists
     */
    extractArtwork(filePath: string): Promise<ArrayBuffer | null>;

    /**
     * Gets supported file extensions
     * @returns Array of supported file extensions
     */
    getSupportedFileExtensions(): string[];

    /**
     * Checks if a file is a supported audio file
     * @param filePath Path to the file
     * @returns True if the file is a supported audio file, false otherwise
     */
    isSupportedAudioFile(filePath: string): boolean;
}

/**
 * Interface for audio metadata
 */
export interface AudioMetadata {
    title?: string;
    artist?: string;
    albumArtist?: string;
    album?: string;
    year?: number;
    track?: {
        no?: number;
        of?: number;
    };
    disk?: {
        no?: number;
        of?: number;
    };
    genre?: string[];
    composer?: string[];
    duration?: number;
    bitrate?: number;
    sampleRate?: number;
    format?: string;
    codec?: string;
    fileSize?: number;
    hasArtwork?: boolean;
}
